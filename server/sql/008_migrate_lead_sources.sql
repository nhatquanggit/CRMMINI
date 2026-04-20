-- ============================================================
-- Migration 008: Lead Source (Module 9)
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

BEGIN TRANSACTION;
BEGIN TRY

  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'lead_source'
  )
  BEGIN
    ALTER TABLE Customers
      ADD lead_source NVARCHAR(30) NOT NULL CONSTRAINT DF_Customers_LeadSource DEFAULT 'OTHER';

    PRINT 'Da them cot lead_source vao Customers.';
  END
  ELSE
  BEGIN
    PRINT 'Cot lead_source da ton tai, bo qua ADD COLUMN.';
  END

  -- Ensure value set is valid
  IF EXISTS (
    SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Customers_LeadSource' AND parent_object_id = OBJECT_ID('Customers')
  )
  BEGIN
    EXEC('ALTER TABLE Customers DROP CONSTRAINT CK_Customers_LeadSource;');
  END

  -- Use dynamic SQL to avoid compile-time "Invalid column name" in same batch
  EXEC('
    ALTER TABLE Customers
      ADD CONSTRAINT CK_Customers_LeadSource
        CHECK (lead_source IN (''WEBSITE'',''FACEBOOK'',''ZALO'',''REFERRAL'',''EVENT'',''ADS'',''OTHER''));
  ');

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('Customers') AND name = 'IX_Customers_LeadSource'
  )
  BEGIN
    EXEC('CREATE INDEX IX_Customers_LeadSource ON Customers(lead_source);');
  END

  COMMIT TRANSACTION;
  PRINT '✓ Migration 008 THANH CONG!';

END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  PRINT '✗ Migration 008 THAT BAI!';
  PRINT 'Ten loi  : ' + ERROR_MESSAGE();
  PRINT 'Dong loi : ' + CAST(ERROR_LINE() AS NVARCHAR);
  PRINT 'Ma loi   : ' + CAST(ERROR_NUMBER() AS NVARCHAR);
END CATCH;
