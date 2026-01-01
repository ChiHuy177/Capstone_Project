using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CapstoneProject.Server.Migrations
{
    /// <inheritdoc />
    public partial class updatetableuserconfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SystemConfigs");

            migrationBuilder.AddColumn<string>(
                name: "Prompt",
                table: "UserConfigs",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a3e0a2c9-4bdf-4f9e-9d6c-2e2e7d5c6a11"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 27, 10, 10, 34, 982, DateTimeKind.Utc).AddTicks(7285));

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("b4f1b3da-5cea-41aa-ab77-9c9c3f7d8b22"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 27, 10, 10, 34, 982, DateTimeKind.Utc).AddTicks(7737));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Prompt",
                table: "UserConfigs");

            migrationBuilder.CreateTable(
                name: "SystemConfigs",
                columns: table => new
                {
                    Key = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsEncrypted = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Value = table.Column<string>(type: "varchar(2000)", maxLength: 2000, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
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
                value: new DateTime(2025, 10, 27, 1, 36, 16, 644, DateTimeKind.Utc).AddTicks(5202));

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("b4f1b3da-5cea-41aa-ab77-9c9c3f7d8b22"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 27, 1, 36, 16, 644, DateTimeKind.Utc).AddTicks(5785));
        }
    }
}
