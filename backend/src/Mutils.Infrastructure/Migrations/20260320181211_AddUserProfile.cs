using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mutils.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BronzeBadge = table.Column<int>(type: "integer", nullable: false),
                    SilverBadge = table.Column<int>(type: "integer", nullable: false),
                    GoldBadge = table.Column<int>(type: "integer", nullable: false),
                    SapphireBadge = table.Column<int>(type: "integer", nullable: false),
                    RubyBadge = table.Column<int>(type: "integer", nullable: false),
                    EmeraldBadge = table.Column<int>(type: "integer", nullable: false),
                    DiamondBadge = table.Column<int>(type: "integer", nullable: false),
                    TowerPerk1 = table.Column<int>(type: "integer", nullable: false),
                    TowerPerk2 = table.Column<int>(type: "integer", nullable: false),
                    TowerPerk3 = table.Column<int>(type: "integer", nullable: false),
                    TowerPerk4 = table.Column<int>(type: "integer", nullable: false),
                    TowerPerk5 = table.Column<int>(type: "integer", nullable: false),
                    TowerPerk6 = table.Column<int>(type: "integer", nullable: false),
                    TowerPerk7 = table.Column<int>(type: "integer", nullable: false),
                    TowerPerk8 = table.Column<int>(type: "integer", nullable: false),
                    TowerPerk9 = table.Column<int>(type: "integer", nullable: false),
                    TowerPerk10 = table.Column<int>(type: "integer", nullable: false),
                    TowerPerk11 = table.Column<int>(type: "integer", nullable: false),
                    TowerPerk12 = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserProfiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserProfiles_UserId",
                table: "UserProfiles",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserProfiles");
        }
    }
}
