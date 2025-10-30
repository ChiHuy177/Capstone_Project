using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CapstoneProject.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddUserConfigTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a3e0a2c9-4bdf-4f9e-9d6c-2e2e7d5c6a11"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 27, 1, 36, 16, 644, DateTimeKind.Utc).AddTicks(5202));

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("b4f1b3da-5cea-41aa-ab77-9c9c3f7d8b22"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 27, 1, 36, 16, 644, DateTimeKind.Utc).AddTicks(5785));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a3e0a2c9-4bdf-4f9e-9d6c-2e2e7d5c6a11"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 27, 1, 35, 27, 801, DateTimeKind.Utc).AddTicks(6725));

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("b4f1b3da-5cea-41aa-ab77-9c9c3f7d8b22"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 27, 1, 35, 27, 801, DateTimeKind.Utc).AddTicks(7335));
        }
    }
}
