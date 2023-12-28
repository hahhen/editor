import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { mdxjs } from 'micromark-extension-mdxjs'
import React from 'react'
import {
  addExportVisitor$,
  addImportVisitor$,
  addLexicalNode$,
  addMdastExtension$,
  addSyntaxExtension$,
  addToMarkdownExtension$,
  insertDecoratorNode$,
  jsxComponentDescriptors$,
  jsxIsAvailable$
} from '../core'
import { $createLexicalJsxNode, LexicalJsxNode } from './LexicalJsxNode'
import { LexicalJsxVisitor } from './LexicalJsxVisitor'
import { MdastMdxJsEsmVisitor } from './MdastMdxJsEsmVisitor'
import { MdastMdxJsxElementVisitor } from './MdastMdxJsxElementVisitor'
import * as Mdast from 'mdast'
import { Signal, map } from '@mdxeditor/gurx'
import { realmPlugin } from '@/RealmWithPlugins'

/**
 * @internal
 */
export type MdastJsx = MdxJsxTextElement | MdxJsxFlowElement

/**
 * Defines the structure of a JSX component property.
 */
export interface JsxPropertyDescriptor {
  /**
   * The name of the property
   */
  name: string
  /**
   * The type of the property
   */
  type: 'string' | 'number'
  /**
   * Wether the property is required
   */
  required?: boolean
}

/**
 * Defines the structure of a JSX component that can be used within the markdown document.
 */
export interface JsxComponentDescriptor {
  /**
   * The tag name
   */
  name: string
  /**
   * Wether the component is a flow or text component (inline or block)
   */
  kind: 'flow' | 'text'
  /**
   * The module path from which the component can be imported
   * Omit to skip injecting an import statement
   */
  source?: string
  /**
   * Wether the component is the default export of the module
   */
  defaultExport?: boolean
  /**
   * The properties that can be applied to the component
   */
  props: JsxPropertyDescriptor[]
  /**
   * Wether or not the component has children
   */
  hasChildren?: boolean

  /**
   * The editor to use for editing the component
   */
  Editor: React.ComponentType<JsxEditorProps>
}

/**
 * The properties passed to a JSX Editor component.
 */
export interface JsxEditorProps {
  /** The MDAST node to edit */
  mdastNode: MdastJsx
  descriptor: JsxComponentDescriptor
}

type JsxTextPayload = {
  kind: 'text'
  name: string
  props: Record<string, string>
  children?: MdxJsxTextElement['children']
}

type JsxFlowPayload = {
  kind: 'flow'
  name: string
  props: Record<string, string>
  children?: MdxJsxFlowElement['children']
}

type InsertJsxPayload = JsxTextPayload | JsxFlowPayload

export function isMdastJsxNode(node: Mdast.Content | Mdast.Parent | Mdast.Root): node is MdastJsx {
  return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement'
}

function toMdastJsxAttributes(attributes: Record<string, string>): MdastJsx['attributes'] {
  return Object.entries(attributes).map(([name, value]) => ({
    type: 'mdxJsxAttribute',
    name,
    value
  }))
}

export const insertJsx$ = Signal<InsertJsxPayload>((r) => {
  r.link(
    r.pipe(
      insertJsx$,
      map(({ kind, name, children, props }) => {
        return () => {
          const attributes = toMdastJsxAttributes(props)

          if (kind === 'flow') {
            return $createLexicalJsxNode({
              type: 'mdxJsxFlowElement',
              name,
              children: children ?? [],
              attributes
            })
          } else {
            return $createLexicalJsxNode({
              type: 'mdxJsxTextElement',
              name,
              children: children ?? [],
              attributes
            })
          }
        }
      })
    ),
    insertDecoratorNode$
  )
})

/**
 * The parameters of the `jsxPlugin`.
 */
export interface JsxPluginParams {
  /**
   * A set of descriptors that document the JSX elements used in the document.
   */
  jsxComponentDescriptors: JsxComponentDescriptor[]
}

export const jsxPlugin = realmPlugin<JsxPluginParams>({
  init: (realm, _: JsxPluginParams) => {
    realm.pubIn({
      // import
      [jsxIsAvailable$]: true,
      [addMdastExtension$]: mdxFromMarkdown(),
      [addSyntaxExtension$]: mdxjs(),
      [addImportVisitor$]: [MdastMdxJsxElementVisitor, MdastMdxJsEsmVisitor],

      // export
      [addLexicalNode$]: LexicalJsxNode,
      [addExportVisitor$]: LexicalJsxVisitor,
      [addToMarkdownExtension$]: mdxToMarkdown()
    })
  },

  update(realm, params) {
    realm.pub(jsxComponentDescriptors$, params?.jsxComponentDescriptors || [])
  }
})
