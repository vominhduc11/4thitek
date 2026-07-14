package com.devwonder.backend.event;

import java.util.Set;

/**
 * Phat ra khi du lieu public (product / blog / content) thay doi, de kich hoat ISR
 * on-demand revalidation tren main-fe. Listener chay AFTER_COMMIT nen main-fe chi re-fetch
 * sau khi transaction da commit (khong doc phai du lieu cu).
 *
 * Tags theo hop dong voi main-fe: products, product:{id}, blogs, blog:{id}, content,
 * content:{section}.
 */
public record RevalidateContentEvent(Set<String> tags) {
}
