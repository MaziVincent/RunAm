using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RunAm.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRiderOnboardingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "RiderProfiles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "AgreedAt",
                table: "RiderProfiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AgreedToTerms",
                table: "RiderProfiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "RiderProfiles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "State",
                table: "RiderProfiles",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Address",
                table: "RiderProfiles");

            migrationBuilder.DropColumn(
                name: "AgreedAt",
                table: "RiderProfiles");

            migrationBuilder.DropColumn(
                name: "AgreedToTerms",
                table: "RiderProfiles");

            migrationBuilder.DropColumn(
                name: "City",
                table: "RiderProfiles");

            migrationBuilder.DropColumn(
                name: "State",
                table: "RiderProfiles");
        }
    }
}
