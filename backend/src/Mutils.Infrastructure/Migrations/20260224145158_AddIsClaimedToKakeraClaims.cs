using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mutils.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsClaimedToKakeraClaims : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsClaimed",
                table: "KakeraClaims",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsClaimed",
                table: "KakeraClaims");
        }
    }
}
