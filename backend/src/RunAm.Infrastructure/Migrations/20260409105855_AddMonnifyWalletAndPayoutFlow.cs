using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RunAm.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMonnifyWalletAndPayoutFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExternalReference",
                table: "WalletTransactions",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ActivatedAt",
                table: "Wallets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Wallets",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MonnifyAccountName",
                table: "Wallets",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MonnifyAccountNumber",
                table: "Wallets",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MonnifyAccountReference",
                table: "Wallets",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MonnifyBankCode",
                table: "Wallets",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MonnifyBankName",
                table: "Wallets",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Nin",
                table: "Users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SettlementAccountName",
                table: "RiderProfiles",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SettlementAccountNumber",
                table: "RiderProfiles",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SettlementBankCode",
                table: "RiderProfiles",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SettlementBankName",
                table: "RiderProfiles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DestinationAccountName",
                table: "RiderPayouts",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DestinationAccountNumber",
                table: "RiderPayouts",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DestinationBankCode",
                table: "RiderPayouts",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DestinationBankName",
                table: "RiderPayouts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastCheckedAt",
                table: "RiderPayouts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "WalletRefunded",
                table: "RiderPayouts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_ExternalReference",
                table: "WalletTransactions",
                column: "ExternalReference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Wallets_MonnifyAccountReference",
                table: "Wallets",
                column: "MonnifyAccountReference",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WalletTransactions_ExternalReference",
                table: "WalletTransactions");

            migrationBuilder.DropIndex(
                name: "IX_Wallets_MonnifyAccountReference",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "ExternalReference",
                table: "WalletTransactions");

            migrationBuilder.DropColumn(
                name: "ActivatedAt",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "MonnifyAccountName",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "MonnifyAccountNumber",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "MonnifyAccountReference",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "MonnifyBankCode",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "MonnifyBankName",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "Nin",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SettlementAccountName",
                table: "RiderProfiles");

            migrationBuilder.DropColumn(
                name: "SettlementAccountNumber",
                table: "RiderProfiles");

            migrationBuilder.DropColumn(
                name: "SettlementBankCode",
                table: "RiderProfiles");

            migrationBuilder.DropColumn(
                name: "SettlementBankName",
                table: "RiderProfiles");

            migrationBuilder.DropColumn(
                name: "DestinationAccountName",
                table: "RiderPayouts");

            migrationBuilder.DropColumn(
                name: "DestinationAccountNumber",
                table: "RiderPayouts");

            migrationBuilder.DropColumn(
                name: "DestinationBankCode",
                table: "RiderPayouts");

            migrationBuilder.DropColumn(
                name: "DestinationBankName",
                table: "RiderPayouts");

            migrationBuilder.DropColumn(
                name: "LastCheckedAt",
                table: "RiderPayouts");

            migrationBuilder.DropColumn(
                name: "WalletRefunded",
                table: "RiderPayouts");
        }
    }
}
