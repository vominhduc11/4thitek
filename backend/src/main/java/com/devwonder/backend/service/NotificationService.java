package com.devwonder.backend.service;

import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.dto.notify.NotifyResponse;
import com.devwonder.backend.entity.Account;
import com.devwonder.backend.entity.Notify;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.NotifyRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotifyRepository notifyRepository;
    private final AccountRepository accountRepository;
    private final WebSocketEventPublisher webSocketEventPublisher;
    private final PushNotificationDispatchService pushNotificationDispatchService;

    @Transactional(readOnly = true)
    public List<NotifyResponse> getByAccount(Long accountId) {
        return notifyRepository.findByAccountIdOrderByCreatedAtDesc(accountId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Page<NotifyResponse> getByAccount(Long accountId, Pageable pageable) {
        Pageable effectivePageable = withDefaultSort(pageable, "createdAt");
        return notifyRepository.findByAccountId(accountId, effectivePageable).map(this::toResponse);
    }

    @Transactional
    public NotifyResponse create(CreateNotifyRequest request) {
        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        Notify notify = new Notify();
        notify.setAccount(account);
        notify.setTitle(request.title());
        notify.setContent(request.body());
        notify.setType(request.type());
        notify.setLink(request.link());
        notify.setDeepLink(request.deepLink());
        notify.setIsRead(false);
        NotifyResponse created = toResponse(notifyRepository.save(notify));
        webSocketEventPublisher.publishNotificationCreated(account.getUsername(), created);
        afterCommitOrNow(() -> pushNotificationDispatchService.sendNotificationCreated(account, created));
        return created;
    }

    @Transactional
    public NotifyResponse markRead(Long notifyId) {
        Notify notify = notifyRepository.findById(notifyId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notify.setIsRead(true);
        notify.setReadAt(Instant.now());
        return toResponse(notifyRepository.save(notify));
    }

    @Transactional
    public NotifyResponse markUnread(Long notifyId) {
        Notify notify = notifyRepository.findById(notifyId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notify.setIsRead(false);
        notify.setReadAt(null);
        return toResponse(notifyRepository.save(notify));
    }

    @Transactional
    public int markAllReadByAccount(Long accountId) {
        return notifyRepository.markAllReadByAccountId(accountId, Instant.now());
    }

    @Transactional
    public void delete(Long notifyId) {
        notifyRepository.deleteById(notifyId);
    }

    private NotifyResponse toResponse(Notify notify) {
        return new NotifyResponse(
                notify.getId(),
                notify.getAccount() == null ? null : notify.getAccount().getId(),
                notify.getTitle(),
                notify.getContent(),
                notify.getIsRead(),
                notify.getType(),
                notify.getLink(),
                notify.getDeepLink(),
                notify.getReadAt(),
                notify.getCreatedAt()
        );
    }

    private Pageable withDefaultSort(Pageable pageable, String defaultSortBy) {
        if (pageable == null || pageable.isUnpaged()) {
            return PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, defaultSortBy));
        }
        if (pageable.getSort().isSorted()) {
            return pageable;
        }
        return PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, defaultSortBy)
        );
    }

    private void afterCommitOrNow(Runnable task) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            task.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                task.run();
            }
        });
    }
}
