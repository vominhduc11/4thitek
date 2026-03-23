package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

class DataConsistencyMigrationTests {

    @Test
    void v15RepairsHistoricalSerialOwnershipStockAndCompletedAt() throws SQLException {
        String url = "jdbc:h2:mem:data_consistency_migration;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE";
        DataSource dataSource = new DriverManagerDataSource(url, "sa", "");

        Flyway.configure()
                .cleanDisabled(false)
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .target(MigrationVersion.fromVersion("14"))
                .load()
                .migrate();

        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        jdbcTemplate.update(
                "insert into accounts (id, username, email, password, created_at, updated_at) values (?, ?, ?, ?, current_timestamp, current_timestamp)",
                1L, "dealer-migration@example.com", "dealer-migration@example.com", "encoded-password"
        );
        jdbcTemplate.update(
                "insert into dealers (id_account, business_name, customer_status) values (?, ?, ?)",
                1L, "Dealer Migration", "ACTIVE"
        );
        jdbcTemplate.update(
                "insert into products (id, sku, name, stock, is_deleted, created_at, updated_at) values (?, ?, ?, ?, ?, current_timestamp, current_timestamp)",
                100L, "SKU-MIGRATION-1", "Migration Product", 99, false
        );
        jdbcTemplate.update(
                """
                insert into orders (
                    id, order_code, status, payment_method, payment_status, is_deleted, id_dealer,
                    created_at, updated_at, completed_at
                ) values (?, ?, ?, ?, ?, ?, ?, current_timestamp, current_timestamp, ?)
                """,
                200L, "SCS-1-LEGACY", "COMPLETED", "BANK_TRANSFER", "PAID", false, 1L, null
        );
        jdbcTemplate.update(
                """
                insert into product_serials (
                    id, serial, status, id_product, id_dealer, id_order, imported_at, warehouse_id, warehouse_name
                ) values (?, ?, ?, ?, ?, ?, current_timestamp, ?, ?)
                """,
                300L, "SERIAL-AVAILABLE-LEGACY", "AVAILABLE", 100L, 1L, null, "main", "Kho"
        );
        jdbcTemplate.update(
                """
                insert into product_serials (
                    id, serial, status, id_product, id_dealer, id_order, imported_at, warehouse_id, warehouse_name
                ) values (?, ?, ?, ?, ?, ?, current_timestamp, ?, ?)
                """,
                301L, "SERIAL-AVAILABLE-CLEAN", "AVAILABLE", 100L, null, null, "main", "Kho"
        );
        jdbcTemplate.update(
                """
                insert into product_serials (
                    id, serial, status, id_product, id_dealer, id_order, imported_at, warehouse_id, warehouse_name
                ) values (?, ?, ?, ?, ?, ?, current_timestamp, ?, ?)
                """,
                302L, "SERIAL-ASSIGNED-LEGACY", "ASSIGNED", 100L, null, 200L, "main", "Kho"
        );

        Flyway.configure()
                .cleanDisabled(false)
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .load()
                .migrate();

        assertThat(jdbcTemplate.queryForObject(
                "select id_dealer from product_serials where id = ?",
                Long.class,
                300L
        )).isNull();
        assertThat(jdbcTemplate.queryForObject(
                "select id_dealer from product_serials where id = ?",
                Long.class,
                302L
        )).isEqualTo(1L);
        assertThat(jdbcTemplate.queryForObject(
                "select stock from products where id = ?",
                Integer.class,
                100L
        )).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject(
                "select completed_at is not null from orders where id = ?",
                Boolean.class,
                200L
        )).isTrue();

        try (Connection connection = dataSource.getConnection();
             ResultSet resultSet = connection.getMetaData().getColumns(null, null, "orders", "completed_at")) {
            assertThat(resultSet.next()).isTrue();
            assertThat(resultSet.getString("TYPE_NAME")).containsIgnoringCase("TIME ZONE");
        }
    }

    @Test
    void v16BackfillsNullDealerStatusAndEnforcesNotNull() throws SQLException {
        String url = "jdbc:h2:mem:dealer_status_migration;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE";
        DataSource dataSource = new DriverManagerDataSource(url, "sa", "");

        Flyway.configure()
                .cleanDisabled(false)
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .target(MigrationVersion.fromVersion("15"))
                .load()
                .migrate();

        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        jdbcTemplate.update(
                "insert into accounts (id, username, email, password, created_at, updated_at) values (?, ?, ?, ?, current_timestamp, current_timestamp)",
                10L, "dealer-null-status@example.com", "dealer-null-status@example.com", "encoded-password"
        );
        jdbcTemplate.update(
                "insert into dealers (id_account, business_name, customer_status) values (?, ?, ?)",
                10L, "Dealer Null Status", null
        );

        Flyway.configure()
                .cleanDisabled(false)
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .load()
                .migrate();

        assertThat(jdbcTemplate.queryForObject(
                "select customer_status from dealers where id_account = ?",
                String.class,
                10L
        )).isEqualTo("ACTIVE");

        try (Connection connection = dataSource.getConnection();
             ResultSet resultSet = connection.getMetaData().getColumns(null, null, "dealers", "customer_status")) {
            assertThat(resultSet.next()).isTrue();
            assertThat(resultSet.getInt("NULLABLE")).isEqualTo(java.sql.DatabaseMetaData.columnNoNulls);
        }
    }
}
