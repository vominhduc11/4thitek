part of 'support_screen.dart';

class _SupportHeroSection extends StatelessWidget {
  const _SupportHeroSection({
    required this.texts,
    required this.ticketCode,
    required this.latestStatus,
    required this.submittedAt,
    required this.slaLabel,
    required this.hasLatestError,
    required this.onRetryLatest,
    required this.onCreateTicket,
    required this.onCallHotline,
    required this.onSendEmail,
    required this.onCopyHotline,
    required this.onCopyEmail,
    this.onOpenReply,
  });

  final _SupportTexts texts;
  final String? ticketCode;
  final String? latestStatus;
  final DateTime? submittedAt;
  final String slaLabel;
  final bool hasLatestError;
  final Future<void> Function() onRetryLatest;
  final VoidCallback onCreateTicket;
  final VoidCallback? onOpenReply;
  final VoidCallback onCallHotline;
  final VoidCallback onSendEmail;
  final VoidCallback onCopyHotline;
  final VoidCallback onCopyEmail;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final hasTicket = ticketCode != null && submittedAt != null;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          colors: <Color>[
            colors.primary.withValues(alpha: 0.14),
            colors.surfaceContainerHigh,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.48),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              texts.supportCenterTitle,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              texts.supportCenterDescription,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colors.onSurfaceVariant,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 14),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: colors.surface.withValues(alpha: 0.82),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: colors.outlineVariant.withValues(alpha: 0.42),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              texts.statusSummaryTitle,
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              hasTicket
                                  ? texts.statusSummarySubtitle(ticketCode!)
                                  : texts.noActiveTicketSummary,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colors.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (hasTicket && latestStatus != null)
                        _CompactStatusBadge(
                          label: texts.statusLabel(latestStatus!),
                          status: latestStatus!,
                        ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  if (hasTicket) ...[
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        _MetaPill(
                          label: texts.ticketIdLabel,
                          value: ticketCode!,
                        ),
                        _MetaPill(
                          label: texts.submittedAtLabel,
                          value: _formatDateTime(submittedAt!),
                        ),
                        _MetaPill(
                          label: texts.responseSlaLabel,
                          value: slaLabel,
                        ),
                      ],
                    ),
                  ] else
                    Text(
                      texts.noActiveTicketSummary,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colors.onSurfaceVariant,
                        height: 1.45,
                      ),
                    ),
                  if (hasLatestError) ...[
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: onRetryLatest,
                      icon: const Icon(Icons.refresh_rounded),
                      label: Text(texts.retryAction),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    key: const ValueKey<String>('support-open-create-button'),
                    onPressed: onCreateTicket,
                    icon: const Icon(Icons.add_circle_outline),
                    label: Text(texts.startNewTicketAction),
                  ),
                ),
                if (onOpenReply != null) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      key: const ValueKey<String>(
                        'support-open-followup-button',
                      ),
                      onPressed: onOpenReply,
                      icon: const Icon(Icons.reply_outlined),
                      label: Text(texts.replyActiveTicketAction),
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: colors.surface.withValues(alpha: 0.82),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: colors.outlineVariant.withValues(alpha: 0.32),
                ),
              ),
              child: Theme(
                data: theme.copyWith(dividerColor: Colors.transparent),
                child: ExpansionTile(
                  tilePadding: EdgeInsets.zero,
                  childrenPadding: const EdgeInsets.only(bottom: 8),
                  collapsedShape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.all(Radius.circular(12)),
                  ),
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.all(Radius.circular(12)),
                  ),
                  title: Text(
                    texts.quickContactTitle,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  subtitle: Text(
                    texts.supportHours,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                  children: [
                    _CompactContactRow(
                      icon: Icons.phone_in_talk_outlined,
                      title: texts.hotlineLabel,
                      value: BusinessProfile.contactPhone,
                      primaryAction: texts.callHotlineAction,
                      secondaryAction: texts.copyAction,
                      onPrimaryTap: onCallHotline,
                      onSecondaryTap: onCopyHotline,
                    ),
                    const SizedBox(height: 8),
                    _CompactContactRow(
                      icon: Icons.alternate_email_outlined,
                      title: texts.emailLabel,
                      value: BusinessProfile.contactEmail,
                      primaryAction: texts.sendEmailAction,
                      secondaryAction: texts.copyAction,
                      onPrimaryTap: onSendEmail,
                      onSecondaryTap: onCopyEmail,
                    ),
                    const SizedBox(height: 8),
                    _CompactContactRow(
                      icon: Icons.schedule_outlined,
                      title: texts.supportHoursLabel,
                      value: texts.supportHours,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CompactContactRow extends StatelessWidget {
  const _CompactContactRow({
    required this.icon,
    required this.title,
    required this.value,
    this.primaryAction,
    this.secondaryAction,
    this.onPrimaryTap,
    this.onSecondaryTap,
  });

  final IconData icon;
  final String title;
  final String value;
  final String? primaryAction;
  final String? secondaryAction;
  final VoidCallback? onPrimaryTap;
  final VoidCallback? onSecondaryTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: colors.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(
                    context,
                  ).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(value, style: Theme.of(context).textTheme.bodyMedium),
                if (onPrimaryTap != null || onSecondaryTap != null) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if (onPrimaryTap != null && primaryAction != null)
                        FilledButton.tonal(
                          onPressed: onPrimaryTap,
                          child: Text(primaryAction!),
                        ),
                      if (onSecondaryTap != null && secondaryAction != null)
                        OutlinedButton(
                          onPressed: onSecondaryTap,
                          child: Text(secondaryAction!),
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SupportGuideCard extends StatelessWidget {
  const _SupportGuideCard({required this.texts});

  final _SupportTexts texts;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      dense: MediaQuery.sizeOf(context).width < 1080,
      title: texts.quickTipsTitle,
      child: Column(
        children: [
          _FaqTile(
            item: _FaqItem(
              title: texts.quickTipOneTitle,
              body: texts.quickTipOneBody,
              icon: Icons.confirmation_number_outlined,
            ),
            showDivider: true,
          ),
          _FaqTile(
            item: _FaqItem(
              title: texts.quickTipTwoTitle,
              body: texts.quickTipTwoBody,
              icon: Icons.verified_outlined,
            ),
            showDivider: true,
          ),
          _FaqTile(
            item: _FaqItem(
              title: texts.quickTipThreeTitle,
              body: texts.quickTipThreeBody,
              icon: Icons.support_agent_outlined,
            ),
            showDivider: false,
          ),
        ],
      ),
    );
  }
}

class _TicketDetailEmptyState extends StatelessWidget {
  const _TicketDetailEmptyState({
    required this.title,
    required this.description,
    required this.ctaLabel,
    required this.onPressed,
  });

  final String title;
  final String description;
  final String ctaLabel;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          Text(
            description,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: colors.onSurfaceVariant,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 14),
          FilledButton.icon(
            onPressed: onPressed,
            icon: const Icon(Icons.add_circle_outline),
            label: Text(ctaLabel),
          ),
        ],
      ),
    );
  }
}
