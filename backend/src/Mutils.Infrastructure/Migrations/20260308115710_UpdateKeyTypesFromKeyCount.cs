using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mutils.Infrastructure.Migrations {
    public partial class UpdateKeyTypesFromKeyCount : Migration {
        protected override void Up(MigrationBuilder migrationBuilder) {
            migrationBuilder.Sql(@"
                UPDATE ""Characters""
                SET ""KeyType"" = CASE
                    WHEN ""KeyCount"" IS NULL OR ""KeyCount"" < 1 THEN NULL
                    WHEN ""KeyCount"" >= 10 THEN 'chaoskey'
                    WHEN ""KeyCount"" >= 6 THEN 'goldkey'
                    WHEN ""KeyCount"" >= 3 THEN 'silverkey'
                    ELSE 'bronzekey'
                END
                WHERE ""KeyCount"" IS NOT NULL;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder) {
        }
    }
}
