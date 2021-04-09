import { TemplateEngine } from '../src/def/Plugin';

export class TestTemplateEngine implements TemplateEngine {

    public render(file: string, data: any) {
        console.log('data=', data);
        return 'This is html rendered by template engine';
    }

}