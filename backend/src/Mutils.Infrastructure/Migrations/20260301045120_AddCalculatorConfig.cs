using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mutils.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCalculatorConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CalculatorConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    TotalPool = table.Column<int>(type: "integer", nullable: false),
                    DisabledLimit = table.Column<int>(type: "integer", nullable: false),
                    AntiDisabled = table.Column<int>(type: "integer", nullable: false),
                    SilverBadge = table.Column<int>(type: "integer", nullable: false),
                    RubyBadge = table.Column<int>(type: "integer", nullable: false),
                    BwLevel = table.Column<int>(type: "integer", nullable: false),
                    Perk2 = table.Column<int>(type: "integer", nullable: false),
                    Perk3 = table.Column<int>(type: "integer", nullable: false),
                    Perk4 = table.Column<int>(type: "integer", nullable: false),
                    OwnedTotal = table.Column<int>(type: "integer", nullable: false),
                    OwnedDisabled = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalculatorConfigs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CalculatorConfigs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CalculatorConfigs_UserId",
                table: "CalculatorConfigs",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CalculatorConfigs");
        }
    }
}
