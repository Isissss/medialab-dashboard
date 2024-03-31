import React, { useMemo, useEffect, forwardRef, useCallback, ReactNode, ButtonHTMLAttributes } from 'react'
import { Slate, Editable, withReact, useSlate, useSelected, ReactEditor } from 'slate-react'
import ReactDOM from 'react-dom'
import {
  Editor,
  Transforms,
  Text,
  createEditor,
  Descendant,
  Range,
  Element as SlateElement,
  BaseEditor,
  Node
} from 'slate'
import isHotkey from 'is-hotkey'
import isUrl from 'is-url'
import { Icon } from '../ui/icon';
import clsx from 'clsx';
import { Label } from '../ui/label';
type CustomElement = { type: 'paragraph'; children: Descendant[] } 
type CustomLinkElement = { type: 'link'; url: string; children: CustomText[] }
type CustomText = { text: string; strikethrough?: true } & { text: string; bold?: true } & { text: string; italic?: true } & { text: string; underlined?: true }


declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: CustomElement | CustomLinkElement
    Text: CustomText
  }
}

type Props = {
  updateObj: (obj: any) => void
}

const withInlines = editor => {
  const { insertData, insertText, isInline, isElementReadOnly  } =
    editor 

  editor.isInline = element =>
    ['link'].includes(element.type) || isInline(element)

  editor.isElementReadOnly = element =>
    element.type === 'badge' || isElementReadOnly(element)

  editor.insertText = text => {
    if (text && isUrl(text)) {
      wrapLink(editor, text)
    } else {
      insertText(text)
    }
  }

  editor.insertData = (data: any) => {
    const text = data.getData('text/plain')

    if (text && isUrl(text)) {
      wrapLink(editor, text)
    } else {
      insertData(data)
    }
  }

  return editor
}

const serialize = (node: Node) => {
  if (Text.isText(node)) {
    let string = node.text
    if (node.bold) {
      string = `**${string}**`
    }

    if (node.italic) {
      string = `*${string}*`
    }

    if (node.underlined) {
      string = `__${string}__`
    }

    if (node.strikethrough) {
      string = `~~${string}~~`
    }

    // get data-slate-length attribute

    return string
  }

  const children = node.children?.map((n: Descendant) => serialize(n)).join('')

  switch (SlateElement.isElement(node) && node.type) {
    case 'paragraph':
      return `${children}\n`
    case 'link':
      node = node as CustomLinkElement
      return `[${children}](${node.url})`
    default:
      return children
  }

}

const insertLink = (editor: Editor, url: string) => {
  if (editor.selection) {
    wrapLink(editor, url)
  }
}

const wrapLink = (editor: Editor, url: string) => {
  if (isLinkActive(editor)) {
    unwrapLink(editor)
  }

  const { selection } = editor
  const isCollapsed = selection && Range.isCollapsed(selection)

  const link = {
    type: 'link',
    url,
    children: isCollapsed ? [{ text: url }] : [],
  }  as SlateElement

  if (isCollapsed) {
    Transforms.insertNodes(editor, link)
     Transforms.unsetNodes(editor, 'url')
  } else {
    Transforms.wrapNodes(editor, link, { split: true })
    Transforms.collapse(editor, { edge: 'end' })  
  }
}
const LinkComponent = ({ attributes, children, element }) => {
  const selected = useSelected()
  return (
    <>
      <span className='group relative inline-block'>
        <a
          {...attributes}
          href={element.url}
          className={clsx(
            'text-blue-400 underline group',
            selected && 'bg-blue-100'
          )}
        >
          <span className='hidden group-hover:block absolute -top-10 bg-gray-300 rounded-md p-2 text-black' contentEditable={false}>
            {element.url}
          </span>
          {children}
        </a>
      </span>
    </>
  )
}

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
}

type PropsWithChildren = {
  className?: string; 
} & React.HTMLAttributes<HTMLDivElement>;

const Toolbar = forwardRef<HTMLDivElement, PropsWithChildren>(
  ({ className, ...props }, ref) => (
    <Menu
      {...props}
      ref={ref}
      className={`${className} relative mt-0 flex flex-row gap-2`}
    />
  )
);

const MarkButton = ({ format, icon }) => {
  const editor = useSlate()
  return (
    <Button
      active={isMarkActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  )
}


export const HoveringMenuExample = ({ updateObj }: Props) => {
  const editor = useMemo(() => withInlines(withReact(createEditor())), [])
  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])
  const [value, setValue] = React.useState("")

  useEffect(() => {
    console.log(value)
    updateObj((prev) => ({
      ...prev,
      description: value
    }));
  }
    , [value])
  return (
    <div className='max-w-[520px] mb-4'>
      <Slate editor={editor} initialValue={initialValue}
        onChange={() =>
          setValue(serialize(editor))
        }>
        <div className='flex flex-col lg:flex-row lg:gap-3 lg:justify-between lg:items-end mb-4'>
          <Label className='text-[14px] font-semibold text-gray-700'>Content  </Label>
          <Toolbar>
            <MarkButton format="bold" icon="format_bold" />
            <MarkButton format="italic" icon="format_italic" />
            <MarkButton format="underlined" icon="format_underlined" />
            <MarkButton format="strikethrough" icon="format_strikethrough" />
            <AddLinkButton />
            <RemoveLinkButton />
          </Toolbar>
        </div>
        <div className='flex flex-row justify-between'>
          <p className="text-xs text-gray-500">Gebruik de knoppen rechts om opmaak toe te voegen.</p> <span className='italic text-gray-500 font-normal text-xs'>{value.length} / 2000</span> </div>
        <Editable
          className='p-4 rounded-md border border-gray-200 text-[14px]'
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="Enter some text..."
          onKeyDown={event => {
            for (const hotkey in HOTKEYS) {
              if (isHotkey(hotkey, event as any)) {
                event.preventDefault()
                const mark = HOTKEYS[hotkey]
                toggleMark(editor, mark)
              }
            }
          }}
          onDOMBeforeInput={(event: InputEvent) => {
            switch (event.inputType) {
              case 'formatBold':
                event.preventDefault()
                return toggleMark(editor, 'bold')
              case 'formatItalic':
                event.preventDefault()
                return toggleMark(editor, 'italic')
              case 'formatUnderline':
                event.preventDefault()
                return toggleMark(editor, 'underlined')
              case 'formatStrikethrough':
                event.preventDefault()
                return toggleMark(editor, 'strikethrough')
            }
          }}
        />
      </Slate>
    </div>
  )
}

const Menu = forwardRef<HTMLDivElement, PropsWithChildren>(
  ({ className, ...props }, ref) => (
    <div
      {...props}
      data-test-id="menu"
      ref={ref}
      className={className}
    />
  )
);


export const Portal = ({ children }: { children?: ReactNode }) => {
  return typeof document === 'object'
    ? ReactDOM.createPortal(children, document.body)
    : null
}

const Element = props => {
  const { attributes, children, element } = props
  switch (element.type) {
    case 'link':
      return <LinkComponent {...props} />
    default:
      return <p {...attributes}>{children}</p>
  }
}

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor) as { [key: string]: boolean } | null
  return marks ? marks[format] === true : false
}

const Leaf = ({ attributes, children, leaf }: { attributes: any, children: any, leaf: CustomText }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underlined) {
    children = <u>{children}</u>
  }

  if (leaf.strikethrough) {
    children = <del>{children}</del>
  }

  return <span {...attributes}>{children}</span>
}


interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { 
  active?: boolean;
  reversed?: boolean;
}

export const Button = ({
  className,
  active,
  reversed,
  ...props
}: ButtonProps) => (
  <button
    {...props}
    className={`${className} cursor-pointer bg-slate-50 p-[2px] rounded-md border ${reversed ? (active ? 'text-white' : 'text-gray-500') : (active ? 'text-black' : 'text-gray-400')}`}
  />
);

const AddLinkButton = () => {
  const editor = useSlate()
  return (
    <Button
      onMouseDown={event => {
        event.preventDefault()
        const url = window.prompt('Enter the URL of the link:')
        if (!url) return
        insertLink(editor, url)
      }}
    >
      <Icon>link</Icon>
    </Button>
  )
}
const isLinkActive = (editor: Editor) => {
  // @ts-expect-error idk how to fix this
  const [link] = Editor.nodes(editor, {
    match: n =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
  })
  return !!link
}

const unwrapLink =  (editor: Editor) => {
  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
  })
}
const RemoveLinkButton = () => {
  const editor = useSlate()

  return (
    <Button
      active={isLinkActive(editor)}
      onMouseDown={() => {
        if (isLinkActive(editor)) {
          unwrapLink(editor)
        }
      }}
    >
      <Icon>link_off</Icon>
    </Button>
  )
}



const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      {
        type: 'link',
        url: 'https://en.wikipedia.org/wiki/Hypertext',
        children: [{ text: 'hyperlink' }],
      },
      {
        text: 'This example shows how you can make a hovering menu appear above your content, which you can use to make text ',
      },
      { text: 'bold', bold: true },
      { text: ', ' },
      { text: 'italic', italic: true },
      { text: ', or anything else you might want to do!' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'Try it out yourself! Just ' },
      { text: 'select any piece of text and the menu will appear', bold: true },
      { text: '.' },
    ],
  },
]

export default HoveringMenuExample