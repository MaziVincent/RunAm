using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RunAm.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HardenPaymentReferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_PaymentGatewayRef",
                table: "Payments");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_PaymentGatewayRef",
                table: "Payments",
                column: "PaymentGatewayRef",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_PaymentGatewayRef",
                table: "Payments");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_PaymentGatewayRef",
                table: "Payments",
                column: "PaymentGatewayRef");
        }
    }
}
