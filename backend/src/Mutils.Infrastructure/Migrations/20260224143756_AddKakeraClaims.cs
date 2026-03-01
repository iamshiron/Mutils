using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mutils.Infrastructure.Migrations {
    /// <inheritdoc />
    public partial class AddKakeraClaims : Migration {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder) {
            migrationBuilder.CreateTable(
                name: "KakeraClaims",
                columns: table => new {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CharacterId = table.Column<Guid>(type: "uuid", nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Value = table.Column<int>(type: "integer", nullable: false),
                    ClaimedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table => {
                    table.PrimaryKey("PK_KakeraClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KakeraClaims_Characters_CharacterId",
                        column: x => x.CharacterId,
                        principalTable: "Characters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_KakeraClaims_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_KakeraClaims_CharacterId",
                table: "KakeraClaims",
                column: "CharacterId");

            migrationBuilder.CreateIndex(
                name: "IX_KakeraClaims_ClaimedAt",
                table: "KakeraClaims",
                column: "ClaimedAt");

            migrationBuilder.CreateIndex(
                name: "IX_KakeraClaims_Type",
                table: "KakeraClaims",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_KakeraClaims_UserId",
                table: "KakeraClaims",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder) {
            migrationBuilder.DropTable(
                name: "KakeraClaims");
        }
    }
}
