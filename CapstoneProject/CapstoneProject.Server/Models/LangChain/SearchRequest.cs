using System.ComponentModel.DataAnnotations;

namespace CapstoneProject.Server.Models.LangChain
{
    public class SearchRequest
    {
        [Required(ErrorMessage = "Query là bắt buộc")]
        [MinLength(1, ErrorMessage = "Query không được rỗng")]
        public string Query { get; set; } = string.Empty;

        [Range(1, 20, ErrorMessage = "TopK phải từ 1 đến 20")]
        public int TopK { get; set; } = 5;
        public int? Year { get; set; } = null;
    }
}
