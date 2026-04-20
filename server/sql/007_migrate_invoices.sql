-- ============================================================
-- Migration 007: Invoices (Module 8)
-- Database: CRM Mini (SQL Server)
-- Run in: SQL Server Management Studio
-- ============================================================

PRINT '================================================';
PRINT 'Database dang chay: ' + DB_NAME();
PRINT 'User: ' + SUSER_SNAME();
PRINT '================================================';

IF OBJECT_ID('Users', 'U') IS NULL OR OBJECT_ID('Deals', 'U') IS NULL OR OBJECT_ID('Customers', 'U') IS NULL OR OBJECT_ID('Products', 'U') IS NULL
BEGIN
  PRINT 'LOI: Thieu bang phu thuoc (Users/Deals/Customers/Products).';
  RETURN;
END

IF HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE TABLE') <> 1
BEGIN
  PRINT 'LOI: User hien tai KHONG co quyen CREATE TABLE tren database.';
  RETURN;
END

BEGIN TRANSACTION;
BEGIN TRY

  IF OBJECT_ID('InvoiceItems', 'U') IS NOT NULL
  BEGIN
    DROP TABLE InvoiceItems;
    PRINT 'Da xoa bang InvoiceItems cu.';
  END

  IF OBJECT_ID('Invoices', 'U') IS NOT NULL
  BEGIN
    DROP TABLE Invoices;
    PRINT 'Da xoa bang Invoices cu.';
  END

  CREATE TABLE Invoices (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    invoice_no    NVARCHAR(30)  NOT NULL UNIQUE,
    deal_id       INT           NOT NULL,
    customer_id   INT           NOT NULL,
    status        NVARCHAR(20)  NOT NULL DEFAULT 'DRAFT', -- DRAFT, SENT, PAID, OVERDUE, CANCELLED
    subtotal      DECIMAL(18,2) NOT NULL,
    discount_pct  DECIMAL(5,2)  NOT NULL DEFAULT 0,
    tax_pct       DECIMAL(5,2)  NOT NULL DEFAULT 0,
    total_amount  DECIMAL(18,2) NOT NULL,
    due_date      DATETIME2     NULL,
    paid_at       DATETIME2     NULL,
    notes         NVARCHAR(MAX) NULL,
    created_by    INT           NOT NULL,
    created_at    DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_at    DATETIME2     NOT NULL DEFAULT GETDATE(),

    CONSTRAINT CK_Invoices_Status CHECK (status IN ('DRAFT','SENT','PAID','OVERDUE','CANCELLED')),
    CONSTRAINT FK_Invoices_Deals FOREIGN KEY (deal_id) REFERENCES Deals(id),
    CONSTRAINT FK_Invoices_Customers FOREIGN KEY (customer_id) REFERENCES Customers(id),
    CONSTRAINT FK_Invoices_Users FOREIGN KEY (created_by) REFERENCES Users(id)
  );

  CREATE TABLE InvoiceItems (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    invoice_id    INT           NOT NULL,
    product_id    INT           NOT NULL,
    description   NVARCHAR(255) NULL,
    quantity      DECIMAL(18,2) NOT NULL,
    unit_price    DECIMAL(18,2) NOT NULL,
    line_total    DECIMAL(18,2) NOT NULL,
    created_at    DATETIME2     NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_InvoiceItems_Invoices FOREIGN KEY (invoice_id) REFERENCES Invoices(id) ON DELETE CASCADE,
    CONSTRAINT FK_InvoiceItems_Products FOREIGN KEY (product_id) REFERENCES Products(id)
  );

  CREATE INDEX IX_Invoices_DealId ON Invoices(deal_id);
  CREATE INDEX IX_Invoices_CustomerId ON Invoices(customer_id);
  CREATE INDEX IX_Invoices_Status ON Invoices(status);
  CREATE INDEX IX_Invoices_CreatedBy ON Invoices(created_by);
  CREATE INDEX IX_Invoices_DueDate ON Invoices(due_date);

  CREATE INDEX IX_InvoiceItems_InvoiceId ON InvoiceItems(invoice_id);
  CREATE INDEX IX_InvoiceItems_ProductId ON InvoiceItems(product_id);

  COMMIT TRANSACTION;
  PRINT '✓ Migration 007 THANH CONG!';

END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  PRINT '✗ Migration 007 THAT BAI!';
  PRINT 'Ten loi  : ' + ERROR_MESSAGE();
  PRINT 'Dong loi : ' + CAST(ERROR_LINE() AS NVARCHAR);
  PRINT 'Ma loi   : ' + CAST(ERROR_NUMBER() AS NVARCHAR);
END CATCH;
