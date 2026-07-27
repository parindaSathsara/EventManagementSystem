-- Third-party ticketing link (client feedback 2026-06-20): guest "Buy Now"
-- opens this URL directly.
ALTER TABLE `Event` ADD COLUMN `ticketUrl` TEXT NULL;

-- Guest follows (client feedback 2026-07-09): guests have no account, so
-- follows are keyed by an anonymous per-install device id. The composite
-- unique guarantees one followerCount bump per device.
-- CreateTable
CREATE TABLE `GuestFollow` (
    `id` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `artistId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GuestFollow_artistId_idx`(`artistId`),
    UNIQUE INDEX `GuestFollow_deviceId_artistId_key`(`deviceId`, `artistId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GuestFollow` ADD CONSTRAINT `GuestFollow_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
