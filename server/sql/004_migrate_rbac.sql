-- ============================================================
-- Migration 004: RBAC - Update Users role constraint
-- Them role MANAGER, them cot is_active
-- Database: CRM Mini (SQL Server)
-- Run in: SQL Server Management Studio
-- ============================================================

PRINT '================================================';
PRINT 'Database dang chay: ' + DB_NAME();
PRINT 'User: ' + SUSER_SNAME();
PRINT '================================================';

IF OBJECT_ID('Users', 'U') IS NULL
BEGIN
  PRINT 'LOI: Khong tim thay bang Users!';
  PRINT 'Hay chon dung database CRM trong dropdown SSMS!';
  RETURN;
END

PRINT 'OK: Tim thay bang Users';

BEGIN TRANSACTION;

BEGIN TRY

  -- ─── 1. Drop CHECK constraint cu tren cot role ───────────
  DECLARE @ckName NVARCHAR(255) = '';
  SELECT TOP 1 @ckName = cc.name
  FROM sys.check_constraints cc
  JOIN sys.columns col
    ON cc.parent_object_id = col.object_id
   AND cc.parent_column_id = col.column_id
  WHERE cc.parent_object_id = OBJECT_ID('Users')
    AND col.name = 'role';

  IF LEN(@ckName) > 0
  BEGIN
    PRINT 'Dang xoa CHECK constraint cu: ' + @ckName;
    EXEC('ALTER TABLE Users DROP CONSTRAINT [' + @ckName + ']');
  END
  ELSE
  BEGIN
    PRINT 'Khong co CHECK constraint nao tren cot role, bo qua.';
  END

  -- ─── 2. Them CHECK constraint moi voi MANAGER ────────────
  ALTER TABLE Users
    ADD CONSTRAINT CK_Users_Role
      CHECK (role IN ('ADMIN', 'MANAGER', 'SALES'));

  PRINT 'Da them CHECK constraint moi: ADMIN | MANAGER | SALES';

  -- ─── 3. Them cot is_active neu chua co ───────────────────
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'is_active'
  )
  BEGIN
    ALTER TABLE Users ADD is_active BIT NOT NULL DEFAULT 1;
    PRINT 'Da them cot is_active (BIT, default 1 = active).';
  END
  ELSE
  BEGIN
    PRINT 'Cot is_active da ton tai, bo qua.';
  END

  -- ─── 4. Index tren role + is_active ──────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('Users') AND name = 'IX_Users_Role'
  )
  BEGIN
    CREATE INDEX IX_Users_Role ON Users(role);
    PRINT 'Da tao index IX_Users_Role.';
  END

  COMMIT TRANSACTION;
  PRINT '';
  PRINT '✓ Migration 004 THANH CONG!';

END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  PRINT '';
  PRINT '✗ Migration 004 THAT BAI!';
  PRINT 'Ten loi  : ' + ERROR_MESSAGE();
  PRINT 'Dong loi : ' + CAST(ERROR_LINE() AS NVARCHAR);
  PRINT 'Ma loi   : ' + CAST(ERROR_NUMBER() AS NVARCHAR);
END CATCH;

-- ─── Xac nhan ket qua ──────────────────────────────────────
IF OBJECT_ID('Users', 'U') IS NOT NULL
BEGIN
  PRINT '';
  PRINT '--- Cau truc bang Users hien tai ---';
  SELECT
    COLUMN_NAME    AS [Cot],
    DATA_TYPE      AS [Kieu],
    IS_NULLABLE    AS [Null?],
    COLUMN_DEFAULT AS [Default]
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Users'
  ORDER BY ORDINAL_POSITION;
END
