import React, { useMemo, useEffect, forwardRef, useCallback, ButtonHTMLAttributes, KeyboardEvent } from 'react'
import { Slate, Editable, withReact, useSlate, useSelected, ReactEditor } from 'slate-react'
import {
  Editor,
  Transforms,
  Text as SlateText,
  createEditor,
  Descendant,
  Range,
  Element as SlateElement,
  BaseEditor,
  Node
} from 'slate'
import isHotkey from 'is-hotkey'
import isUrl from 'is-url'
import { Icon } from './ui/icon';
import clsx from 'clsx';
import { Label } from './ui/label';

type CustomElement = { type: 'paragraph'; children: Descendant[] }
type CustomLinkElement = { type: 'link'; url: string; children: CustomText[] }
type CustomText = { text: string; strikethrough?: true } & { text: string; bold?: true } & { text: string; italic?: true } & { text: string; underlined?: true }

type PropsWithChildren = {
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
}

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: CustomElement | CustomLinkElement
    Text: CustomText
  }
}

const InlineChromiumBugfix = () => (
  <span
    contentEditable={false}
    className="text-[0px]"
  >
    {String.fromCodePoint(160) /* Non-breaking space */}
  </span>
)

const withInlines = editor => {
  const { insertData, insertText, isInline, isElementReadOnly } =
    editor

  editor.isInline = element =>
    ['link'].includes(element.type) || isInline(element)

  editor.isElementReadOnly = element =>
    element.type === 'badge' || isElementReadOnly(element)

  editor.insertText = (text: string) => {
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
  if (SlateText.isText(node)) {
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

    return string
  }

  const children = node.children?.map((n: Descendant) => serialize(n)).join('')

  switch (SlateElement.isElement(node) && node.type) {
    case 'paragraph':
      return `${children}\n`
    case 'link':
      node = node as CustomLinkElement
      console.log(children)
      if (isUrl(children)) return node.url; // if the children is a url, return the url because it's already displayed as a link
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
  console.log(isCollapsed)

  const link = {
    type: 'link',
    url,
    children: isCollapsed ? [{ text: url }] : [],
  } as SlateElement

  if (isCollapsed) {
    Transforms.insertNodes(editor, link)
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
          <InlineChromiumBugfix />
          {children}
          <InlineChromiumBugfix />
        </a>
      </span>
    </>
  )
}

const Toolbar = ({ className, ...props }: PropsWithChildren) => (
  <div
    {...props}
    className={clsx(
      className,
      'relative mt-0 flex flex-row gap-2'
    )}
  />
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
      onClick={(e) => e.preventDefault()} 
    >
      <Icon>{icon}</Icon>
    </Button>
  )
}

const checkForHotkey = (event: KeyboardEvent<HTMLDivElement>, editor: Editor) => {
  for (const hotkey in HOTKEYS) {
    if (isHotkey(hotkey, event as any)) {
      event.preventDefault()
      const mark = HOTKEYS[hotkey]
      toggleMark(editor, mark)
    }
  }
}

export const SlateEditor = ({ onUpdate }: { onUpdate: (value: string) => void }) => {
  const editor = useMemo(() => withInlines(withReact(createEditor())), [])
  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])
  const [value, setValue] = React.useState("")

  useEffect(() => {
    onUpdate(value)
  }, [value])

  return (
    <div className='w-full mb-4'>
      <Slate editor={editor}
        initialValue={[{ type: 'paragraph', children: [{ text: '' }] }] as Descendant[]}
        onChange={() =>
          setValue(serialize(editor))
        }>
        <div className='flex flex-col lg:flex-row lg:gap-3 lg:justify-between lg:items-end mb-4'>
          <Label className='text-[14px] font-semibold text-gray-700' htmlFor="description">Content  </Label>
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
          <p className="text-xs text-gray-500 mb-2">Gebruik de knoppen rechts om opmaak toe te voegen.</p>
          <span className='italic text-gray-500 font-normal text-xs'>{value.length} / 2000</span>
        </div>
        <Editable
          className='p-4 rounded-md border border-gray-200 text-[14px] !min-h-[150px] border-input bg-background px-3 py-2 text-sm !ring-offset-background file:!border-0 file:!bg-transparent file:!text-sm file:!font-medium placeholder:!text-muted-foreground focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-ring focus-visible:!ring-offset-2 disabled:!cursor-not-allowed disabled:!opacity-50'
          renderElement={renderElement}
          name='description'
          renderLeaf={renderLeaf}
          onKeyDown={event => checkForHotkey(event, editor)}
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
  const marks = Editor.marks(editor)
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

  return <span className={
    leaf.text === '' && "pl-[0.1px]"
  } {...attributes}>{children}</span>
}

export const Button = ({
  className,
  active,
  reversed,
  ...props
}: {
  className?: string;
  active?: boolean;
  reversed?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) => (
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

const unwrapLink = (editor: Editor) => {
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
      onClick={(e) => e.preventDefault()} 
    >
      <Icon>link_off</Icon>
    </Button>
  )
}


export default SlateEditor