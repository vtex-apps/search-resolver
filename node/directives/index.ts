import { SchemaDirectiveVisitor } from 'graphql-tools'

import { WithSegment } from './withSegment'
import { ToVtexAssets } from './toVtexAssets'

export const schemaDirectives: Record<string, typeof SchemaDirectiveVisitor> = {
  withSegment: WithSegment,
  toVtexAssets: ToVtexAssets,
}
