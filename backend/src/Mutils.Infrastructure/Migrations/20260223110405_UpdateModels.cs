using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mutils.Infrastructure.Migrations {
    /// <inheritdoc />
    public partial class UpdateModels : Migration {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder) {
            migrationBuilder.AddColumn<Guid>(
                name: "SeriesId",
                table: "Characters",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Bundles",
                columns: table => new {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table => {
                    table.PrimaryKey("PK_Bundles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Series",
                columns: table => new {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table => {
                    table.PrimaryKey("PK_Series", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BundleCharacterEntries",
                columns: table => new {
                    BundleId = table.Column<Guid>(type: "uuid", nullable: false),
                    CharacterId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table => {
                    table.PrimaryKey("PK_BundleCharacterEntries", x => new { x.BundleId, x.CharacterId });
                    table.ForeignKey(
                        name: "FK_BundleCharacterEntries_Bundles_CharacterId",
                        column: x => x.CharacterId,
                        principalTable: "Bundles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BundleCharacterEntries_Characters_CharacterId",
                        column: x => x.CharacterId,
                        principalTable: "Characters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BundleSeriesEntries",
                columns: table => new {
                    BundleId = table.Column<Guid>(type: "uuid", nullable: false),
                    SeriesId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table => {
                    table.PrimaryKey("PK_BundleSeriesEntries", x => new { x.BundleId, x.SeriesId });
                    table.ForeignKey(
                        name: "FK_BundleSeriesEntries_Bundles_SeriesId",
                        column: x => x.SeriesId,
                        principalTable: "Bundles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BundleSeriesEntries_Series_SeriesId",
                        column: x => x.SeriesId,
                        principalTable: "Series",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Characters_SeriesId",
                table: "Characters",
                column: "SeriesId");

            migrationBuilder.CreateIndex(
                name: "IX_BundleCharacterEntries_CharacterId",
                table: "BundleCharacterEntries",
                column: "CharacterId");

            migrationBuilder.CreateIndex(
                name: "IX_BundleSeriesEntries_SeriesId",
                table: "BundleSeriesEntries",
                column: "SeriesId");

            migrationBuilder.CreateIndex(
                name: "IX_Series_Name",
                table: "Series",
                column: "Name");

            migrationBuilder.AddForeignKey(
                name: "FK_Characters_Series_SeriesId",
                table: "Characters",
                column: "SeriesId",
                principalTable: "Series",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder) {
            migrationBuilder.DropForeignKey(
                name: "FK_Characters_Series_SeriesId",
                table: "Characters");

            migrationBuilder.DropTable(
                name: "BundleCharacterEntries");

            migrationBuilder.DropTable(
                name: "BundleSeriesEntries");

            migrationBuilder.DropTable(
                name: "Bundles");

            migrationBuilder.DropTable(
                name: "Series");

            migrationBuilder.DropIndex(
                name: "IX_Characters_SeriesId",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "SeriesId",
                table: "Characters");
        }
    }
}
