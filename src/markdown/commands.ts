import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Table,
  type LucideIcon,
} from 'lucide-react';

export type TextCommand = {
  id: string;
  label: string;
  keywords: string[];
  icon: LucideIcon;
  hint?: string;
  insert: string;
  caretOffset: number;
  selectLength?: number;
  /** Needs a blank line above it: a divider after a paragraph line parses as a
   *  setext heading, and a GFM table cannot interrupt a paragraph at all. */
  separate: boolean;
};

const TABLE = ['| Column | Column |', '| --- | --- |', '|  |  |'].join('\n');

export const TEXT_COMMANDS: TextCommand[] = [
  {
    id: 'heading',
    label: 'Heading',
    keywords: ['h1', 'title', 'heading', 'big'],
    icon: Heading1,
    hint: 'mod+alt+1',
    insert: '# ',
    caretOffset: 2,
    separate: false,
  },
  {
    id: 'subtitle',
    label: 'Subtitle',
    keywords: ['h2', 'subtitle', 'section', 'subheading'],
    icon: Heading2,
    hint: 'mod+alt+2',
    insert: '## ',
    caretOffset: 3,
    separate: false,
  },
  {
    id: 'subsubtitle',
    label: 'Sub-subtitle',
    keywords: ['h3', 'subsubtitle', 'minor'],
    icon: Heading3,
    hint: 'mod+alt+3',
    insert: '### ',
    caretOffset: 4,
    separate: false,
  },
  {
    id: 'bullet',
    label: 'Bullet list',
    keywords: ['bullet', 'unordered', 'ul', 'list', 'point'],
    icon: List,
    hint: 'mod+shift+8',
    insert: '- ',
    caretOffset: 2,
    separate: false,
  },
  {
    id: 'numbered',
    label: 'Numbered list',
    keywords: ['numbered', 'ordered', 'ol', 'steps'],
    icon: ListOrdered,
    hint: 'mod+shift+7',
    insert: '1. ',
    caretOffset: 3,
    separate: false,
  },
  {
    id: 'task',
    label: 'Task list',
    keywords: ['task', 'todo', 'checkbox', 'checklist'],
    icon: ListTodo,
    insert: '- [ ] ',
    caretOffset: 6,
    separate: false,
  },
  {
    id: 'quote',
    label: 'Quote',
    keywords: ['quote', 'blockquote', 'citation'],
    icon: Quote,
    insert: '> ',
    caretOffset: 2,
    separate: false,
  },
  {
    id: 'code',
    label: 'Code block',
    keywords: ['code', 'snippet', 'fence', 'pre'],
    icon: Code,
    insert: '```\n\n```',
    caretOffset: 3,
    separate: true,
  },
  {
    id: 'divider',
    label: 'Divider',
    keywords: ['divider', 'rule', 'hr', 'separator', 'break'],
    icon: Minus,
    insert: '---\n',
    caretOffset: 4,
    separate: true,
  },
  {
    id: 'table',
    label: 'Table',
    keywords: ['table', 'grid', 'rows', 'columns'],
    icon: Table,
    insert: TABLE,
    caretOffset: 2,
    selectLength: 6,
    separate: true,
  },
];
