
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, ArrowRight } from 'lucide-react';

const forumTopics = [
  {
    category: 'Culturas e Produção',
    icon: '🌱',
    topics: [
      { title: 'Melhores práticas para o plantio de soja', replies: 42, lastReply: '2h' },
      { title: 'Dicas para aumentar a produtividade do milho safrinha', replies: 128, lastReply: '5h' },
      { title: 'Controle de pragas em lavouras de algodão', replies: 76, lastReply: '1d' },
    ],
  },
  {
    category: 'Manejo e Tecnologia',
    icon: '⚙️',
    topics: [
      { title: 'Tudo sobre Irrigação por Gotejamento', replies: 95, lastReply: '1h' },
      { title: 'Qual o melhor fertilizante para pastagem?', replies: 210, lastReply: '3h' },
      { title: 'Discussão sobre manejo de solo e plantio direto', replies: 154, lastReply: '2d' },
    ],
  },
  {
    category: 'Maquinário e Equipamentos',
    icon: '🚜',
    topics: [
      { title: 'Manutenção preventiva de colheitadeiras', replies: 67, lastReply: '8h' },
      { title: 'Comparativo: John Deere vs. Case IH', replies: 302, lastReply: '1d' },
      { title: 'Drones na agricultura: quais as melhores aplicações?', replies: 189, lastReply: '3d' },
    ],
  },
];

export default function ForumPage() {
  return (
    <div className="container mx-auto max-w-4xl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Fórum AgroUs</h1>
        <p className="text-muted-foreground mt-2">O lugar para trocar experiências e conhecimento com outros produtores.</p>
      </header>
      
      <div className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar tópicos no fórum..." className="pl-10 h-12" />
        </div>
        <Button size="lg">Novo Tópico</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Accordion type="single" collapsible defaultValue="item-0">
            {forumTopics.map((category, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="p-6 text-xl hover:no-underline">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{category.icon}</span>
                    {category.category}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-secondary/30">
                  <div className="divide-y">
                    {category.topics.map((topic, topicIndex) => (
                      <div key={topicIndex} className="p-4 flex items-center justify-between hover:bg-secondary/70">
                        <div className="flex items-center gap-4">
                          <MessageSquare className="h-6 w-6 text-primary" />
                          <div>
                            <p className="font-semibold text-base">{topic.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {topic.replies} respostas · Última há {topic.lastReply}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
