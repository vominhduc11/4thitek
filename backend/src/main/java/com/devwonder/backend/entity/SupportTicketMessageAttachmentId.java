package com.devwonder.backend.entity;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class SupportTicketMessageAttachmentId implements Serializable {

    private Long message;
    private Long mediaAsset;
}
