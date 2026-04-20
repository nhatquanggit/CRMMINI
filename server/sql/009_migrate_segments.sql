-- ============================================================
-- Migration 009: Customer Segmentation (Module 10)
-- Database: CRM Mini (SQL Server)
-- Run in: SQL Server Management Studio
-- ============================================================

PRINT '================================================';
PRINT 'Database dang chay: ' + DB_NAME();
PRINT 'User: ' + SUSER_SNAME();
PRINT '================================================';

IF OBJECT_ID('Customers', 'U') IS NULL
BEGIN
  PRINT 'LOI: Khong tim thay bang Customers.';
  RETURN;
END

IF OBJECT_ID('Users', 'U') IS NULL
BEGIN
  PRINT 'LOI: Khong tim thay bang Users.';
  RETURN;
END

BEGIN TRANSACTION;
BEGIN TRY

  IF OBJECT_ID('Segments', 'U') IS NOT NULL
  BEGIN
    DROP TABLE Segments;
    PRINT 'Da xoa bang Segments cu.';
  END

  CREATE TABLE Segments (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    name          NVARCHAR(120) NOT NULL UNIQUE,
    description   NVARCHAR(500) NULL,
    status_filter NVARCHAR(20)  NULL, -- NEW, CONTACTED, CONVERTED
    source_filter NVARCHAR(30)  NULL, -- WEBSITE, FACEBOOK, ZALO, REFERRAL, EVENT, ADS, OTHER
    min_deals     INT           NULL,
    min_total_deal_value DECIMAL(18,2) NULL,
    is_vip        BIT           NULL,
    is_active     BIT           NOT NULL DEFAULT 1,
    created_by    INT           NOT NULL,
    created_at    DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_at    DATETIME2     NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Segments_Users FOREIGN KEY (created_by) REFERENCES Users(id)
  );

  CREATE INDEX IX_Segments_IsActive ON Segments(is_active);
  CREATE INDEX IX_Segments_CreatedAt ON Segments(created_at);

  COMMIT TRANSACTION;
  PRINT '✓ Migration 009 THANH CONG!';

END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  PRINT '✗ Migration 009 THAT BAI!';
  PRINT 'Ten loi  : ' + ERROR_MESSAGE();
  PRINT 'Dong loi : ' + CAST(ERROR_LINE() AS NVARCHAR);
  PRINT 'Ma loi   : ' + CAST(ERROR_NUMBER() AS NVARCHAR);
END CATCH;
