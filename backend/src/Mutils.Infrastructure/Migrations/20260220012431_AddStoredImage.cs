using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mutils.Infrastructure.Migrations {
    /// <inheritdoc />
    public partial class AddStoredImage : Migration {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder) {
            migrationBuilder.RenameColumn(
                name: "ImageUrl",
                table: "Characters",
                newName: "OriginalImageUrl");

            migrationBuilder.AddColumn<Guid>(
                name: "StoredImageId",
                table: "Characters",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "StoredImages",
                columns: table => new {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ObjectKey = table.Column<string>(type: "text", nullable: false),
                    BucketName = table.Column<string>(type: "text", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    ContentLength = table.Column<long>(type: "bigint", nullable: false),
                    Width = table.Column<int>(type: "integer", nullable: true),
                    Height = table.Column<int>(type: "integer", nullable: true),
                    OriginalUrl = table.Column<string>(type: "text", nullable: true),
                    Source = table.Column<string>(type: "text", nullable: true),
                    ETag = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table => {
                    table.PrimaryKey("PK_StoredImages", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Characters_StoredImageId",
                table: "Characters",
                column: "StoredImageId");

            migrationBuilder.CreateIndex(
                name: "IX_StoredImages_BucketName_ObjectKey",
                table: "StoredImages",
                columns: new[] { "BucketName", "ObjectKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StoredImages_OriginalUrl",
                table: "StoredImages",
                column: "OriginalUrl");

            migrationBuilder.AddForeignKey(
                name: "FK_Characters_StoredImages_StoredImageId",
                table: "Characters",
                column: "StoredImageId",
                principalTable: "StoredImages",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder) {
            migrationBuilder.DropForeignKey(
                name: "FK_Characters_StoredImages_StoredImageId",
                table: "Characters");

            migrationBuilder.DropTable(
                name: "StoredImages");

            migrationBuilder.DropIndex(
                name: "IX_Characters_StoredImageId",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "StoredImageId",
                table: "Characters");

            migrationBuilder.RenameColumn(
                name: "OriginalImageUrl",
                table: "Characters",
                newName: "ImageUrl");
        }
    }
}
