-- ============================================================
-- Migration 002: Activities Table (Module: Activity Log)
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

  -- Drop foreign key constraints tren Activities neu chung ton tai
  DECLARE @sqlDrop NVARCHAR(MAX) = '';
  SELECT @sqlDrop += 'ALTER TABLE Activities DROP CONSTRAINT [' + fk.name + ']; '
  FROM sys.foreign_keys fk
  WHERE fk.parent_object_id = OBJECT_ID('Activities');

  IF LEN(@sqlDrop) > 0
  BEGIN
    PRINT 'Dang xoa foreign key constraints cu: ' + @sqlDrop;
    EXEC sp_executesql @sqlDrop;
  END

  -- Drop bang Activities cu
  IF OBJECT_ID('Activities', 'U') IS NOT NULL
  BEGIN
    PRINT 'Dang xoa bang Activities cu...';
    DROP TABLE Activities;
    PRINT 'Da xoa bang Activities.';
  END
  ELSE
  BEGIN
    PRINT 'Bang Activities chua ton tai, se tao moi.';
  END

  -- Tao moi bang Activities
  PRINT 'Dang tao bang Activities moi...';

  CREATE TABLE Activities (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    type       NVARCHAR(20)  NOT NULL,   -- NOTE, CALL, EMAIL, MEETING, OTHER
    content    NVARCHAR(MAX) NOT NULL,
    customer_id INT          NULL,
    deal_id     INT          NULL,
    created_by  INT          NOT NULL,
    created_at  DATETIME2    NOT NULL DEFAULT GETDATE(),
    updated_at  DATETIME2    NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Activities_Customers FOREIGN KEY (customer_id)
      REFERENCES Customers(id) ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT FK_Activities_Deals FOREIGN KEY (deal_id)
      REFERENCES Deals(id) ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT FK_Activities_Users FOREIGN KEY (created_by)
      REFERENCES Users(id) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

  -- Tao indexes
  CREATE INDEX IX_Activities_CustomerId ON Activities(customer_id);
  CREATE INDEX IX_Activities_DealId     ON Activities(deal_id);
  CREATE INDEX IX_Activities_CreatedBy  ON Activities(created_by);
  CREATE INDEX IX_Activities_CreatedAt  ON Activities(created_at);
  CREATE INDEX IX_Activities_Type       ON Activities(type);

  COMMIT TRANSACTION;
  PRINT '';
  PRINT '✓ Migration 002 THANH CONG!';

END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;

  PRINT '';
  PRINT '✗ Migration 002 THAT BAI!';
  PRINT 'Ten loi  : ' + ERROR_MESSAGE();
  PRINT 'Dong loi : ' + CAST(ERROR_LINE() AS NVARCHAR);
  PRINT 'Ma loi   : ' + CAST(ERROR_NUMBER() AS NVARCHAR);
END CATCH;

-- BUOC 4: Xac nhan ket qua
IF OBJECT_ID('Activities', 'U') IS NOT NULL
BEGIN
  PRINT '';
  PRINT '--- Cau truc bang Activities ---';
  SELECT
    COLUMN_NAME        AS [Cot],
    DATA_TYPE          AS [Kieu du lieu],
    IS_NULLABLE        AS [Cho phep NULL],
    COLUMN_DEFAULT     AS [Gia tri mac dinh]
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Activities'
  ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
  PRINT 'CANH BAO: Bang Activities khong ton tai sau khi chay script!';
END
