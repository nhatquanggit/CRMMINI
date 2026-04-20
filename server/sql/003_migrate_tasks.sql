-- ============================================================
-- Migration 003: Tasks Table (Module: Task Management)
-- Database: CRM Mini (SQL Server)
-- Run in: SQL Server Management Studio
-- ============================================================

-- BUOC 1: Kiem tra ban dang o dung database chua
PRINT '================================================';
PRINT 'Database dang chay: ' + DB_NAME();
PRINT 'User: ' + SUSER_SNAME();
PRINT '================================================';

-- BUOC 2: Kiem tra cac bang phụ thuoc ton tai chua
IF OBJECT_ID('Users', 'U') IS NULL
BEGIN
  PRINT 'LOI: Khong tim thay bang Users.';
  PRINT 'Hay chon dung database CRM trong dropdown SSMS!';
  RETURN;
END

IF OBJECT_ID('Customers', 'U') IS NULL
BEGIN
  PRINT 'LOI: Khong tim thay bang Customers.';
  RETURN;
END

IF OBJECT_ID('Deals', 'U') IS NULL
BEGIN
  PRINT 'LOI: Khong tim thay bang Deals.';
  RETURN;
END

PRINT 'OK: Tim thay du cac bang bat buoc (Users, Customers, Deals)';

-- BUOC 3: Chay migration trong transaction
BEGIN TRANSACTION;

BEGIN TRY

  -- Drop foreign key constraints tren Tasks neu chung ton tai
  DECLARE @sqlDrop NVARCHAR(MAX) = '';
  SELECT @sqlDrop += 'ALTER TABLE Tasks DROP CONSTRAINT [' + fk.name + ']; '
  FROM sys.foreign_keys fk
  WHERE fk.parent_object_id = OBJECT_ID('Tasks');

  IF LEN(@sqlDrop) > 0
  BEGIN
    PRINT 'Dang xoa foreign key constraints cu: ' + @sqlDrop;
    EXEC sp_executesql @sqlDrop;
  END

  -- Drop bang Tasks cu
  IF OBJECT_ID('Tasks', 'U') IS NOT NULL
  BEGIN
    PRINT 'Dang xoa bang Tasks cu...';
    DROP TABLE Tasks;
    PRINT 'Da xoa bang Tasks.';
  END
  ELSE
  BEGIN
    PRINT 'Bang Tasks chua ton tai, se tao moi.';
  END

  -- Tao moi bang Tasks
  PRINT 'Dang tao bang Tasks moi...';

  CREATE TABLE Tasks (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    title        NVARCHAR(255)  NOT NULL,
    description  NVARCHAR(MAX)  NOT NULL,
    status       NVARCHAR(20)   NOT NULL DEFAULT 'TODO',    -- TODO, IN_PROGRESS, DONE, CANCELLED
    priority     NVARCHAR(20)   NOT NULL DEFAULT 'MEDIUM',  -- LOW, MEDIUM, HIGH, URGENT
    customer_id  INT            NULL,
    deal_id      INT            NULL,
    assigned_to  INT            NOT NULL,
    created_by   INT            NOT NULL,
    due_date     DATETIME2      NOT NULL,
    remind_at    DATETIME2      NULL,
    completed_at DATETIME2      NULL,
    created_at   DATETIME2      NOT NULL DEFAULT GETDATE(),
    updated_at   DATETIME2      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Tasks_Customers FOREIGN KEY (customer_id)
      REFERENCES Customers(id) ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT FK_Tasks_Deals FOREIGN KEY (deal_id)
      REFERENCES Deals(id) ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT FK_Tasks_AssignedTo FOREIGN KEY (assigned_to)
      REFERENCES Users(id) ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT FK_Tasks_CreatedBy FOREIGN KEY (created_by)
      REFERENCES Users(id) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

  -- Tao indexes
  CREATE INDEX IX_Tasks_CustomerId      ON Tasks(customer_id);
  CREATE INDEX IX_Tasks_DealId          ON Tasks(deal_id);
  CREATE INDEX IX_Tasks_AssignedTo      ON Tasks(assigned_to);
  CREATE INDEX IX_Tasks_CreatedBy       ON Tasks(created_by);
  CREATE INDEX IX_Tasks_Status          ON Tasks(status);
  CREATE INDEX IX_Tasks_Priority        ON Tasks(priority);
  CREATE INDEX IX_Tasks_DueDate         ON Tasks(due_date);
  CREATE INDEX IX_Tasks_CreatedAt       ON Tasks(created_at);
  CREATE INDEX IX_Tasks_StatusAssignee  ON Tasks(status, assigned_to);

  COMMIT TRANSACTION;
  PRINT '';
  PRINT '✓ Migration 003 THANH CONG!';

END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;

  PRINT '';
  PRINT '✗ Migration 003 THAT BAI!';
  PRINT 'Ten loi  : ' + ERROR_MESSAGE();
  PRINT 'Dong loi : ' + CAST(ERROR_LINE() AS NVARCHAR);
  PRINT 'Ma loi   : ' + CAST(ERROR_NUMBER() AS NVARCHAR);
END CATCH;

-- BUOC 4: Xac nhan ket qua
IF OBJECT_ID('Tasks', 'U') IS NOT NULL
BEGIN
  PRINT '';
  PRINT '--- Cau truc bang Tasks ---';
  SELECT
    COLUMN_NAME        AS [Cot],
    DATA_TYPE          AS [Kieu du lieu],
    IS_NULLABLE        AS [Cho phep NULL],
    COLUMN_DEFAULT     AS [Gia tri mac dinh]
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Tasks'
  ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
  PRINT 'CANH BAO: Bang Tasks khong ton tai sau khi chay script!';
END
