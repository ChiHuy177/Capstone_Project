using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CapstoneProject.Server.Migrations
{
    /// <inheritdoc />
    public partial class addconfigtable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SystemConfigs",
                columns: table => new
                {
                    Key = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Value = table.Column<string>(type: "varchar(2000)", maxLength: 2000, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    IsEncrypted = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemConfigs", x => x.Key);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a3e0a2c9-4bdf-4f9e-9d6c-2e2e7d5c6a11"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 25, 9, 0, 51, 779, DateTimeKind.Utc).AddTicks(2130));

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("b4f1b3da-5cea-41aa-ab77-9c9c3f7d8b22"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 25, 9, 0, 51, 779, DateTimeKind.Utc).AddTicks(2626));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SystemConfigs");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a3e0a2c9-4bdf-4f9e-9d6c-2e2e7d5c6a11"),
                column: "CreatedAt",
                value: new DateTime(2025, 9, 12, 4, 13, 50, 664, DateTimeKind.Utc).AddTicks(5839));

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("b4f1b3da-5cea-41aa-ab77-9c9c3f7d8b22"),
                column: "CreatedAt",
                value: new DateTime(2025, 9, 12, 4, 13, 50, 664, DateTimeKind.Utc).AddTicks(6353));
        }
    }
}
