import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, BarChart2, Settings, Palette, Type, Moon, Sun } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function AdminPage() {
  return (
    <div className="container mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Painel do Administrador</h1>
        <p className="text-muted-foreground">Gerencie usuários, conteúdo e configurações do site.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gerenciamento de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,254</div>
            <p className="text-xs text-muted-foreground">Total de usuários cadastrados</p>
          </CardContent>
          <CardFooter>
            <Button>Ver Usuários</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderação de Conteúdo</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-muted-foreground">Itens pendentes de revisão</p>
          </CardContent>
           <CardFooter>
            <Button>Revisar Conteúdo</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Análises do Site</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+25%</div>
            <p className="text-xs text-muted-foreground">Crescimento de novos usuários este mês</p>
          </CardContent>
           <CardFooter>
            <Button>Ver Análises</Button>
          </CardFooter>
        </Card>
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Personalização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Moon className="h-4 w-4" /><Sun className="h-4 w-4" /> Tema</Label>
              <div className="flex items-center space-x-2">
                <Switch id="dark-mode" />
                <Label htmlFor="dark-mode">Modo Escuro</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Palette className="h-4 w-4" /> Cor de Destaque</Label>
              <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full bg-primary ring-2 ring-ring"></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full bg-blue-600"></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full bg-red-600"></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full bg-orange-500"></Button>
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="font-select" className="flex items-center gap-2"><Type className="h-4 w-4" /> Fonte</Label>
              <Select defaultValue="roboto">
                <SelectTrigger id="font-select">
                  <SelectValue placeholder="Selecione a fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roboto">Roboto</SelectItem>
                  <SelectItem value="inter">Inter</SelectItem>
                  <SelectItem value="lato">Lato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Salvar Alterações</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
