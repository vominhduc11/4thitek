import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import 'app_settings_controller.dart';
import 'bank_transfer_support.dart';
import 'breakpoints.dart';
import 'cart_controller.dart';
import 'dealer_navigation.dart';
import 'global_search.dart';
import 'models.dart';
import 'order_controller.dart';
import 'return_request_service.dart';
import 'return_request_ui_support.dart';
import 'upload_service.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/order_status_chip.dart';
import 'widgets/section_card.dart';

part 'order_detail_screen_actions.dart';
part 'order_detail_screen_body.dart';
part 'order_detail_screen_sections.dart';
part 'order_detail_screen_texts.dart';
part 'order_detail_screen_widgets.dart';

_OrderDetailTexts _orderDetailTexts(BuildContext context) => _OrderDetailTexts(
  isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
);

const DealerReturnRequestType _defaultCreateReturnRequestType =
    DealerReturnRequestType.defectiveReturn;

void _leaveOrderDetail(BuildContext context) {
  final navigator = Navigator.of(context);
  if (navigator.canPop()) {
    navigator.maybePop();
    return;
  }
  context.goToDealerOrders();
}

class OrderDetailScreen extends StatelessWidget {
  const OrderDetailScreen({super.key, required this.orderId});

  final String orderId;

  @override
  Widget build(BuildContext context) {
    return _OrderDetailRefreshBoundary(
      orderId: orderId,
      child: Builder(builder: _buildScreen),
    );
  }
}
