using CapstoneProject.Server.Services.interfaces;

namespace CapstoneProject.Server.Services.implementations
{
    public class KnowledgeService : IKnowledgeService
    {
        private readonly string _knowledge;

        public KnowledgeService(IWebHostEnvironment environment)
        {
            _knowledge = LoadKnowledgeFile(environment).GetAwaiter().GetResult();
        }

        public string GetKnowledge() => _knowledge;

        private static async Task<string> LoadKnowledgeFile(IWebHostEnvironment environment)
        {
            var knowledgePath = Path.Combine(environment.ContentRootPath, "wwwroot", "knowledge.txt");
            Console.WriteLine(knowledgePath);

            if (File.Exists(knowledgePath))
            {
                return await File.ReadAllTextAsync(knowledgePath);
            }
            else
            {
                Console.WriteLine("Không đọc được file");
                return "";
            }
        }
    }
}
