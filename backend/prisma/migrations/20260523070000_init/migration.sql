-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `role` ENUM('customer', 'artist', 'admin') NOT NULL DEFAULT 'customer',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Artist` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `handle` VARCHAR(191) NOT NULL,
    `bio` TEXT NULL,
    `category` VARCHAR(191) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `isPreferred` BOOLEAN NOT NULL DEFAULT false,
    `followerCount` INTEGER NOT NULL DEFAULT 0,
    `totalReelViews` INTEGER NOT NULL DEFAULT 0,
    `totalEventTickets` INTEGER NOT NULL DEFAULT 0,
    `socialsJson` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Artist_userId_key`(`userId`),
    UNIQUE INDEX `Artist_handle_key`(`handle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` VARCHAR(191) NOT NULL,
    `organizerArtistId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'Concert',
    `coverColor` VARCHAR(191) NOT NULL DEFAULT '#1a0a2e',
    `coverImageUrl` VARCHAR(191) NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Colombo',
    `venueName` VARCHAR(191) NOT NULL,
    `cityName` VARCHAR(191) NOT NULL,
    `addressLine` VARCHAR(191) NULL,
    `geoLat` DOUBLE NULL,
    `geoLng` DOUBLE NULL,
    `ageRestriction` VARCHAR(191) NOT NULL DEFAULT 'All ages',
    `status` ENUM('draft', 'published', 'live', 'cancelled', 'ended') NOT NULL DEFAULT 'published',
    `refundPolicy` TEXT NULL,
    `cancellationPolicy` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Event_organizerArtistId_status_idx`(`organizerArtistId`, `status`),
    INDEX `Event_startsAt_idx`(`startsAt`),
    INDEX `Event_cityName_idx`(`cityName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TicketType` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `priceLabel` VARCHAR(191) NOT NULL,
    `priceCents` INTEGER NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'LKR',
    `total` INTEGER NOT NULL,
    `remaining` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TicketType_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ticket` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `ticketTypeId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `qrPayload` VARCHAR(191) NOT NULL,
    `status` ENUM('active', 'used', 'refunded', 'cancelled') NOT NULL DEFAULT 'active',
    `holderName` VARCHAR(191) NOT NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Ticket_qrPayload_key`(`qrPayload`),
    INDEX `Ticket_userId_status_idx`(`userId`, `status`),
    INDEX `Ticket_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LineupEntry` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `artistId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `LineupEntry_eventId_idx`(`eventId`),
    UNIQUE INDEX `LineupEntry_eventId_artistId_key`(`eventId`, `artistId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reel` (
    `id` VARCHAR(191) NOT NULL,
    `artistId` VARCHAR(191) NOT NULL,
    `caption` TEXT NOT NULL,
    `musicTrackTitle` VARCHAR(191) NULL,
    `musicTrackArtistName` VARCHAR(191) NULL,
    `linkedEventId` VARCHAR(191) NULL,
    `coverColor` VARCHAR(191) NOT NULL DEFAULT '#1a0a2e',
    `coverImageUrl` VARCHAR(191) NULL,
    `videoUrl` VARCHAR(191) NULL,
    `visibility` ENUM('public', 'followers', 'private') NOT NULL DEFAULT 'public',
    `status` ENUM('draft', 'pending_approval', 'published', 'hidden', 'removed', 'rejected') NOT NULL DEFAULT 'published',
    `rejectionReason` TEXT NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `publishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Reel_artistId_publishedAt_idx`(`artistId`, `publishedAt` DESC),
    INDEX `Reel_linkedEventId_idx`(`linkedEventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReelTag` (
    `id` VARCHAR(191) NOT NULL,
    `reelId` VARCHAR(191) NOT NULL,
    `tag` VARCHAR(191) NOT NULL,

    INDEX `ReelTag_tag_idx`(`tag`),
    UNIQUE INDEX `ReelTag_reelId_tag_key`(`reelId`, `tag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Follow` (
    `id` VARCHAR(191) NOT NULL,
    `followerId` VARCHAR(191) NOT NULL,
    `artistId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Follow_artistId_idx`(`artistId`),
    UNIQUE INDEX `Follow_followerId_artistId_key`(`followerId`, `artistId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SavedEvent` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SavedEvent_userId_idx`(`userId`),
    UNIQUE INDEX `SavedEvent_userId_eventId_key`(`userId`, `eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SavedReel` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `reelId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SavedReel_userId_idx`(`userId`),
    UNIQUE INDEX `SavedReel_userId_reelId_key`(`userId`, `reelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReelReaction` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `reelId` VARCHAR(191) NOT NULL,
    `reactionCode` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ReelReaction_reelId_reactionCode_idx`(`reelId`, `reactionCode`),
    UNIQUE INDEX `ReelReaction_userId_reelId_key`(`userId`, `reelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReelRepost` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `reelId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReelRepost_userId_idx`(`userId`),
    UNIQUE INDEX `ReelRepost_userId_reelId_key`(`userId`, `reelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Artist` ADD CONSTRAINT `Artist_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_organizerArtistId_fkey` FOREIGN KEY (`organizerArtistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TicketType` ADD CONSTRAINT `TicketType_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_ticketTypeId_fkey` FOREIGN KEY (`ticketTypeId`) REFERENCES `TicketType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LineupEntry` ADD CONSTRAINT `LineupEntry_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LineupEntry` ADD CONSTRAINT `LineupEntry_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reel` ADD CONSTRAINT `Reel_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reel` ADD CONSTRAINT `Reel_linkedEventId_fkey` FOREIGN KEY (`linkedEventId`) REFERENCES `Event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReelTag` ADD CONSTRAINT `ReelTag_reelId_fkey` FOREIGN KEY (`reelId`) REFERENCES `Reel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Follow` ADD CONSTRAINT `Follow_followerId_fkey` FOREIGN KEY (`followerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Follow` ADD CONSTRAINT `Follow_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedEvent` ADD CONSTRAINT `SavedEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedEvent` ADD CONSTRAINT `SavedEvent_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedReel` ADD CONSTRAINT `SavedReel_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedReel` ADD CONSTRAINT `SavedReel_reelId_fkey` FOREIGN KEY (`reelId`) REFERENCES `Reel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReelReaction` ADD CONSTRAINT `ReelReaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReelReaction` ADD CONSTRAINT `ReelReaction_reelId_fkey` FOREIGN KEY (`reelId`) REFERENCES `Reel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReelRepost` ADD CONSTRAINT `ReelRepost_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReelRepost` ADD CONSTRAINT `ReelRepost_reelId_fkey` FOREIGN KEY (`reelId`) REFERENCES `Reel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

┌─────────────────────────────────────────────────────────┐
│  Update available 5.22.0 -> 7.8.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
