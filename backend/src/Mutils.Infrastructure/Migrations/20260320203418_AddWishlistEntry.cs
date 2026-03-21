using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mutils.Infrastructure.Migrations {
    /// <inheritdoc />
    public partial class AddWishlistEntry : Migration {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder) {
            migrationBuilder.CreateTable(
                name: "WishlistEntries",
                columns: table => new {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CharacterId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsStarwish = table.Column<bool>(type: "boolean", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table => {
                    table.PrimaryKey("PK_WishlistEntries", x => x.Id);
                    table.UniqueConstraint("AK_WishlistEntries_UserId_CharacterId", x => new { x.UserId, x.CharacterId });
                    table.ForeignKey(
                        name: "FK_WishlistEntries_Characters_CharacterId",
                        column: x => x.CharacterId,
                        principalTable: "Characters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WishlistEntries_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WishlistEntries_CharacterId",
                table: "WishlistEntries",
                column: "CharacterId");

            migrationBuilder.CreateIndex(
                name: "IX_WishlistEntries_IsStarwish",
                table: "WishlistEntries",
                column: "IsStarwish");

            migrationBuilder.CreateIndex(
                name: "IX_WishlistEntries_UserId",
                table: "WishlistEntries",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder) {
            migrationBuilder.DropTable(
                name: "WishlistEntries");
        }
    }
}
