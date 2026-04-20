-- ============================================================
-- Migration 005: Quotes & Contracts (Module 6)
-- Database: CRM Mini (SQL Server)
-- Run in: SQL Server Management Studio
-- ============================================================

PRINT '================================================';
PRINT 'Database dang chay: ' + DB_NAME();
PRINT 'User: ' + SUSER_SNAME();
PRINT '================================================';

IF OBJECT_ID('Users', 'U') IS NULL OR OBJECT_ID('Deals', 'U') IS NULL OR OBJECT_ID('Customers', 'U') IS NULL
BEGIN
  PRINT 'LOI: Thieu bang phu thuoc (Users/Deals/Customers).';
  RETURN;
END

-- Kiem tra quyen DDL can thiet truoc khi chay migration
IF HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE TABLE') <> 1
BEGIN
  PRINT 'LOI: User hien tai KHONG co quyen CREATE TABLE tren database.';
  PRINT 'Hay nho DBA cap quyen: GRANT CREATE TABLE TO [nhatquang];';
  RETURN;
END

IF HAS_PERMS_BY_NAME('dbo', 'SCHEMA', 'ALTER') <> 1
BEGIN
  PRINT 'LOI: User hien tai KHONG co quyen ALTER tren schema dbo.';
  PRINT 'Hay nho DBA cap quyen: GRANT ALTER ON SCHEMA::dbo TO [nhatquang];';
  RETURN;
END

IF HAS_PERMS_BY_NAME('dbo.Users', 'OBJECT', 'REFERENCES') <> 1
   OR HAS_PERMS_BY_NAME('dbo.Deals', 'OBJECT', 'REFERENCES') <> 1
   OR HAS_PERMS_BY_NAME('dbo.Customers', 'OBJECT', 'REFERENCES') <> 1
BEGIN
  PRINT 'LOI: User hien tai KHONG co quyen REFERENCES tren bang lien quan.';
  PRINT 'Can cap quyen REFERENCES tren Users/Deals/Customers.';
  RETURN;
END

BEGIN TRANSACTION;
BEGIN TRY

  IF OBJECT_ID('Quotes', 'U') IS NOT NULL
  BEGIN
    DECLARE @sqlDrop NVARCHAR(MAX) = '';
    SELECT @sqlDrop += 'ALTER TABLE Quotes DROP CONSTRAINT [' + fk.name + ']; '
    FROM sys.foreign_keys fk
    WHERE fk.parent_object_id = OBJECT_ID('Quotes');

    IF LEN(@sqlDrop) > 0 EXEC sp_executesql @sqlDrop;

    DROP TABLE Quotes;
    PRINT 'Da xoa bang Quotes cu.';
  END

  CREATE TABLE Quotes (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    quote_no       NVARCHAR(30)  NOT NULL UNIQUE,
    title          NVARCHAR(180) NOT NULL,
    deal_id        INT           NOT NULL,
    customer_id    INT           NOT NULL,
    amount         DECIMAL(18,2) NOT NULL,
    discount_pct   DECIMAL(5,2)  NOT NULL DEFAULT 0,
    tax_pct        DECIMAL(5,2)  NOT NULL DEFAULT 0,
    final_amount   DECIMAL(18,2) NOT NULL,
    status         NVARCHAR(20)  NOT NULL DEFAULT 'DRAFT', -- DRAFT/SENT/APPROVED/REJECTED/EXPIRED/SIGNED
    valid_until    DATETIME2     NULL,
    terms          NVARCHAR(MAX) NULL,
    signed_at      DATETIME2     NULL,
    created_by     INT           NOT NULL,
    created_at     DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_at     DATETIME2     NOT NULL DEFAULT GETDATE(),

    CONSTRAINT CK_Quotes_Status CHECK (status IN ('DRAFT','SENT','APPROVED','REJECTED','EXPIRED','SIGNED')),
    CONSTRAINT FK_Quotes_Deals FOREIGN KEY (deal_id) REFERENCES Deals(id),
    CONSTRAINT FK_Quotes_Customers FOREIGN KEY (customer_id) REFERENCES Customers(id),
    CONSTRAINT FK_Quotes_Users FOREIGN KEY (created_by) REFERENCES Users(id)
  );

  CREATE INDEX IX_Quotes_DealId ON Quotes(deal_id);
  CREATE INDEX IX_Quotes_CustomerId ON Quotes(customer_id);
  CREATE INDEX IX_Quotes_CreatedBy ON Quotes(created_by);
  CREATE INDEX IX_Quotes_Status ON Quotes(status);
  CREATE INDEX IX_Quotes_CreatedAt ON Quotes(created_at);

  COMMIT TRANSACTION;
  PRINT '✓ Migration 005 THANH CONG!';

END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  PRINT '✗ Migration 005 THAT BAI!';
  PRINT 'Ten loi  : ' + ERROR_MESSAGE();
  PRINT 'Dong loi : ' + CAST(ERROR_LINE() AS NVARCHAR);
  PRINT 'Ma loi   : ' + CAST(ERROR_NUMBER() AS NVARCHAR);
END CATCH;
