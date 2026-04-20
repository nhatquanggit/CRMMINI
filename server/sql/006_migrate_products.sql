-- ============================================================
-- Migration 006: Product Catalog (Module 7)
-- Database: CRM Mini (SQL Server)
-- Run in: SQL Server Management Studio
-- ============================================================

PRINT '================================================';
PRINT 'Database dang chay: ' + DB_NAME();
PRINT 'User: ' + SUSER_SNAME();
PRINT '================================================';

IF HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE TABLE') <> 1
BEGIN
  PRINT 'LOI: User hien tai KHONG co quyen CREATE TABLE tren database.';
  RETURN;
END

BEGIN TRANSACTION;
BEGIN TRY

  IF OBJECT_ID('Products', 'U') IS NOT NULL
  BEGIN
    DROP TABLE Products;
    PRINT 'Da xoa bang Products cu.';
  END

  CREATE TABLE Products (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    sku           NVARCHAR(50)  NOT NULL UNIQUE,
    name          NVARCHAR(180) NOT NULL,
    category      NVARCHAR(120) NULL,
    unit          NVARCHAR(30)  NOT NULL DEFAULT 'item',
    price         DECIMAL(18,2) NOT NULL,
    description   NVARCHAR(MAX) NULL,
    is_active     BIT           NOT NULL DEFAULT 1,
    created_by    INT           NOT NULL,
    created_at    DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_at    DATETIME2     NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Products_Users FOREIGN KEY (created_by) REFERENCES Users(id)
  );

  CREATE INDEX IX_Products_Name ON Products(name);
  CREATE INDEX IX_Products_Category ON Products(category);
  CREATE INDEX IX_Products_IsActive ON Products(is_active);
  CREATE INDEX IX_Products_CreatedAt ON Products(created_at);

  COMMIT TRANSACTION;
  PRINT '✓ Migration 006 THANH CONG!';

END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  PRINT '✗ Migration 006 THAT BAI!';
  PRINT 'Ten loi  : ' + ERROR_MESSAGE();
  PRINT 'Dong loi : ' + CAST(ERROR_LINE() AS NVARCHAR);
  PRINT 'Ma loi   : ' + CAST(ERROR_NUMBER() AS NVARCHAR);
END CATCH;
