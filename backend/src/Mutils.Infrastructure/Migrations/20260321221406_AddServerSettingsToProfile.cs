using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mutils.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddServerSettingsToProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BronzeBadgePrice",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 1000);

            migrationBuilder.AddColumn<int>(
                name: "DiamondBadgePrice",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 12000);

            migrationBuilder.AddColumn<int>(
                name: "EmeraldBadgePrice",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 9000);

            migrationBuilder.AddColumn<int>(
                name: "GoldBadgePrice",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 3000);

            migrationBuilder.AddColumn<int>(
                name: "KakeraPerFloor",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 5000);

            migrationBuilder.AddColumn<int>(
                name: "RubyBadgePrice",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 7000);

            migrationBuilder.AddColumn<int>(
                name: "SapphireBadgePrice",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 5000);

            migrationBuilder.AddColumn<int>(
                name: "SilverBadgePrice",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 2000);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BronzeBadgePrice",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "DiamondBadgePrice",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "EmeraldBadgePrice",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "GoldBadgePrice",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "KakeraPerFloor",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "RubyBadgePrice",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "SapphireBadgePrice",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "SilverBadgePrice",
                table: "UserProfiles");
        }
    }
}
