import 'models.dart';
import 'product_catalog_controller.dart';

enum CheckoutValidationIssueCode {
  cartSyncInProgress,
  outOfStock,
  insufficientStock,
  debtPaymentUnavailable,
  debtLimitExceeded,
}

class CheckoutValidationItem {
  const CheckoutValidationItem({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
  });

  final String productId;
  final String productName;
  final int quantity;
  final int unitPrice;

  int get lineTotal => quantity * unitPrice;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'productId': productId,
      'quantity': quantity,
      'unitPrice': unitPrice,
    };
  }
}

class CheckoutValidationRequest {
  const CheckoutValidationRequest({
    required this.items,
    required this.paymentMethod,
    required this.isCartSyncing,
    required this.currentOutstandingDebt,
    required this.creditLimit,
  });

  final List<CheckoutValidationItem> items;
  final OrderPaymentMethod paymentMethod;
  final bool isCartSyncing;
  final int currentOutstandingDebt;
  final int creditLimit;

  int get totalAmount {
    return items.fold<int>(0, (sum, item) => sum + item.lineTotal);
  }

  int get projectedOutstandingDebt => currentOutstandingDebt + totalAmount;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'paymentMethod': paymentMethod.name,
      'items': items.map((item) => item.toJson()).toList(growable: false),
      'currentOutstandingDebt': currentOutstandingDebt,
      'creditLimit': creditLimit,
    };
  }
}

class CheckoutValidationIssue {
  const CheckoutValidationIssue({
    required this.code,
    this.productId,
    this.productName,
    this.availableStock,
    this.projectedOutstandingDebt,
    this.creditLimit,
  });

  final CheckoutValidationIssueCode code;
  final String? productId;
  final String? productName;
  final int? availableStock;
  final int? projectedOutstandingDebt;
  final int? creditLimit;
}

class CheckoutValidationResult {
  const CheckoutValidationResult({required this.issues});

  const CheckoutValidationResult.empty()
    : issues = const <CheckoutValidationIssue>[];

  final List<CheckoutValidationIssue> issues;

  bool get hasIssues => issues.isNotEmpty;
}

abstract class CheckoutValidationDataSource {
  Future<CheckoutValidationResult> validate(CheckoutValidationRequest request);
}

class CheckoutValidationService {
  CheckoutValidationService({
    required this.localDataSource,
    this.remoteDataSource,
  });

  final CheckoutValidationDataSource localDataSource;
  final CheckoutValidationDataSource? remoteDataSource;

  Future<CheckoutValidationResult> validate(
    CheckoutValidationRequest request,
  ) async {
    final remote = remoteDataSource;
    if (remote != null) {
      return remote.validate(request);
    }
    return localDataSource.validate(request);
  }
}

class LocalCheckoutValidationDataSource
    implements CheckoutValidationDataSource {
  LocalCheckoutValidationDataSource({required this.productCatalog});

  final ProductCatalogController? productCatalog;

  @override
  Future<CheckoutValidationResult> validate(
    CheckoutValidationRequest request,
  ) async {
    final issues = <CheckoutValidationIssue>[];
    if (request.isCartSyncing) {
      issues.add(
        const CheckoutValidationIssue(
          code: CheckoutValidationIssueCode.cartSyncInProgress,
        ),
      );
      return CheckoutValidationResult(issues: issues);
    }

    for (final item in request.items) {
      final latestProduct = await _resolveLatestProduct(item.productId);
      final availableStock = latestProduct?.stock;
      if (availableStock == null) {
        continue;
      }
      if (availableStock <= 0) {
        issues.add(
          CheckoutValidationIssue(
            code: CheckoutValidationIssueCode.outOfStock,
            productId: item.productId,
            productName: item.productName,
          ),
        );
        continue;
      }
      if (item.quantity > availableStock) {
        issues.add(
          CheckoutValidationIssue(
            code: CheckoutValidationIssueCode.insufficientStock,
            productId: item.productId,
            productName: item.productName,
            availableStock: availableStock,
          ),
        );
      }
    }

    if (request.paymentMethod == OrderPaymentMethod.debt) {
      if (request.creditLimit <= 0) {
        issues.add(
          const CheckoutValidationIssue(
            code: CheckoutValidationIssueCode.debtPaymentUnavailable,
          ),
        );
      } else if (request.projectedOutstandingDebt > request.creditLimit) {
        issues.add(
          CheckoutValidationIssue(
            code: CheckoutValidationIssueCode.debtLimitExceeded,
            projectedOutstandingDebt: request.projectedOutstandingDebt,
            creditLimit: request.creditLimit,
          ),
        );
      }
    }

    return CheckoutValidationResult(
      issues: List<CheckoutValidationIssue>.unmodifiable(issues),
    );
  }

  Future<Product?> _resolveLatestProduct(String productId) async {
    final catalog = productCatalog;
    if (catalog == null) {
      return null;
    }
    try {
      return await catalog.fetchDetail(productId);
    } catch (_) {
      return catalog.findById(productId);
    }
  }
}
