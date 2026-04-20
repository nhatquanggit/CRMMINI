-- ============================================================
-- Migration 011: Sales Forecasting Targets (Module 12)
-- Database: CRM Mini (SQL Server)
-- Run in: SQL Server Management Studio
-- ============================================================

PRINT '================================================';
PRINT 'Database dang chay: ' + DB_NAME();
PRINT 'User: ' + SUSER_SNAME();
PRINT '================================================';

IF OBJECT_ID('Users', 'U') IS NULL
BEGIN
  PRINT 'LOI: Khong tim thay bang Users.';
  RETURN;
END

BEGIN TRANSACTION;
BEGIN TRY

  IF OBJECT_ID('SalesTargets', 'U') IS NOT NULL
  BEGIN
    DROP TABLE SalesTargets;
    PRINT 'Da xoa bang SalesTargets cu.';
  END

  CREATE TABLE SalesTargets (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    owner_id      INT           NOT NULL,
    target_month  CHAR(7)       NOT NULL, -- YYYY-MM
    target_value  DECIMAL(18,2) NOT NULL,
    note          NVARCHAR(500) NULL,
    created_by    INT           NOT NULL,
    created_at    DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_at    DATETIME2     NOT NULL DEFAULT GETDATE(),

    CONSTRAINT UQ_SalesTargets_OwnerMonth UNIQUE (owner_id, target_month),
    CONSTRAINT CK_SalesTargets_TargetMonth CHECK (target_month LIKE '[1-2][0-9][0-9][0-9]-[0-1][0-9]'),
    CONSTRAINT CK_SalesTargets_TargetValue CHECK (target_value >= 0),
    CONSTRAINT FK_SalesTargets_Owner FOREIGN KEY (owner_id) REFERENCES Users(id),
    CONSTRAINT FK_SalesTargets_Creator FOREIGN KEY (created_by) REFERENCES Users(id)
  );

  CREATE INDEX IX_SalesTargets_TargetMonth ON SalesTargets(target_month);
  CREATE INDEX IX_SalesTargets_OwnerId ON SalesTargets(owner_id);
  CREATE INDEX IX_SalesTargets_CreatedBy ON SalesTargets(created_by);

  COMMIT TRANSACTION;
  PRINT '✓ Migration 011 THANH CONG!';

END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  PRINT '✗ Migration 011 THAT BAI!';
  PRINT 'Ten loi  : ' + ERROR_MESSAGE();
  PRINT 'Dong loi : ' + CAST(ERROR_LINE() AS NVARCHAR);
  PRINT 'Ma loi   : ' + CAST(ERROR_NUMBER() AS NVARCHAR);
END CATCH;
