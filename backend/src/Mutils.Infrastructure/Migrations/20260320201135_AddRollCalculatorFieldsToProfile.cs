using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mutils.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRollCalculatorFieldsToProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BwRollsInvested",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DisabledLimit",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalPool",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalRolls",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BwRollsInvested",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "DisabledLimit",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "TotalPool",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "TotalRolls",
                table: "UserProfiles");
        }
    }
}
