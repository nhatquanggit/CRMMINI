-- ============================================================
-- Migration 010: Support Tickets (Module 11)
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

IF OBJECT_ID('Customers', 'U') IS NULL
BEGIN
  PRINT 'LOI: Khong tim thay bang Customers.';
  RETURN;
END

BEGIN TRANSACTION;
BEGIN TRY

  IF OBJECT_ID('SupportTickets', 'U') IS NOT NULL
  BEGIN
    DROP TABLE SupportTickets;
    PRINT 'Da xoa bang SupportTickets cu.';
  END

  CREATE TABLE SupportTickets (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    ticket_no     NVARCHAR(30)  NOT NULL UNIQUE,
    subject       NVARCHAR(180) NOT NULL,
    description   NVARCHAR(MAX) NOT NULL,
    status        NVARCHAR(20)  NOT NULL DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
    priority      NVARCHAR(20)  NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    category      NVARCHAR(60)  NULL,
    customer_id   INT           NULL,
    assigned_to   INT           NULL,
    created_by    INT           NOT NULL,
    due_date      DATETIME2     NULL,
    resolved_at   DATETIME2     NULL,
    created_at    DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_at    DATETIME2     NOT NULL DEFAULT GETDATE(),

    CONSTRAINT CK_SupportTickets_Status CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
    CONSTRAINT CK_SupportTickets_Priority CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT')),
    CONSTRAINT FK_SupportTickets_Customers FOREIGN KEY (customer_id) REFERENCES Customers(id),
    CONSTRAINT FK_SupportTickets_Assignee FOREIGN KEY (assigned_to) REFERENCES Users(id),
    CONSTRAINT FK_SupportTickets_Creator FOREIGN KEY (created_by) REFERENCES Users(id)
  );

  CREATE INDEX IX_SupportTickets_Status ON SupportTickets(status);
  CREATE INDEX IX_SupportTickets_Priority ON SupportTickets(priority);
  CREATE INDEX IX_SupportTickets_AssignedTo ON SupportTickets(assigned_to);
  CREATE INDEX IX_SupportTickets_CustomerId ON SupportTickets(customer_id);
  CREATE INDEX IX_SupportTickets_CreatedAt ON SupportTickets(created_at);

  COMMIT TRANSACTION;
  PRINT '✓ Migration 010 THANH CONG!';

END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  PRINT '✗ Migration 010 THAT BAI!';
  PRINT 'Ten loi  : ' + ERROR_MESSAGE();
  PRINT 'Dong loi : ' + CAST(ERROR_LINE() AS NVARCHAR);
  PRINT 'Ma loi   : ' + CAST(ERROR_NUMBER() AS NVARCHAR);
END CATCH;
