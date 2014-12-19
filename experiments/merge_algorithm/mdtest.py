#!/usr/bin/env python

from copy import deepcopy
from types import *


class PropertyTypes :
	ARRAY            = "array" 
	LINK_SINGLE      = "link single"
	LINK_ARRAY       = "link array"
	COLUMN_REFERENCE = "column reference"
	URI_TEMPLATE     = "URItemplate"
	OBJECT_SINGLE    = "object single"
	OBJECT_ARRAY     = "object array"
	NATURAL_LANGUAGE = "natural language"
	ATOMIC_SINGLE    = "atomic single"
	ATOMIC_ARRAY     = "atomic array"

	properties = {
		"@language"         : ATOMIC_SINGLE,
		"@base"             : LINK_SINGLE,
		"resources"         : ARRAY,
		"schema"            : OBJECT_SINGLE,
		"table-direction"   : ATOMIC_SINGLE,
		"dialect"           : OBJECT_SINGLE,
		"templates"         : ARRAY,
		"@type"             : ATOMIC_SINGLE,
		"@id"               : LINK_SINGLE,
		"schema"            : OBJECT_SINGLE,
		"notes"             : OBJECT_ARRAY,
		"encoding"          : ATOMIC_SINGLE,
		"lineTerminator"    : ATOMIC_SINGLE,
		"quoteChar"         : ATOMIC_SINGLE,
		"doubleQuote"       : ATOMIC_SINGLE,
		"skipRows"          : ATOMIC_SINGLE,
		"commentPrefix"     : ATOMIC_SINGLE,
		"header"            : ATOMIC_SINGLE,
		"headerRowCount"    : ATOMIC_SINGLE,
		"delimiter"         : ATOMIC_SINGLE,
		"skipColumns"       : ATOMIC_SINGLE,
		"headerColumnCount" : ATOMIC_SINGLE,
		"skipBlankRows"     : ATOMIC_SINGLE,
		"skipInitialSpace"  : ATOMIC_SINGLE,
		"trim"              : ATOMIC_SINGLE,
		"targetFormat"      : LINK_SINGLE,
		"templateFormat"    : LINK_SINGLE,
		"title"             : NATURAL_LANGUAGE,
		"source"            : ATOMIC_SINGLE,
		"columns"           : ARRAY,
		"primaryKey"        : ATOMIC_ARRAY, 
		"foreignKeys"       : OBJECT_ARRAY,
		"urlTemplate"       : URI_TEMPLATE,
		"name"              : ATOMIC_SINGLE,
		"required"          : ATOMIC_SINGLE,
		"null"              : ATOMIC_ARRAY,
		"language"          : ATOMIC_SINGLE,
		"text-direction"    : ATOMIC_SINGLE,
		"separator"         : ATOMIC_SINGLE,
		"format"            : ATOMIC_SINGLE,
		"datatype"          : ATOMIC_SINGLE,
		"length"            : ATOMIC_SINGLE,
		"minLength"         : ATOMIC_SINGLE,
		"maxLength"         : ATOMIC_SINGLE,
		"minimum"           : ATOMIC_SINGLE,
		"maximum"           : ATOMIC_SINGLE,
		"minInclusive"      : ATOMIC_SINGLE,
		"maxInclusive"      : ATOMIC_SINGLE,
		"minExclusive"      : ATOMIC_SINGLE,
		"maxExclusive"      : ATOMIC_SINGLE
	}

# special arrays: resources, templates, columns
#

# Note: foreignKeys->reference->schema is a Link property
#       foreignKeys->reference->column is a column reference property 
#       foreignKeys->columns is a column reference property
#       



def _merge_into_array(A,B) :
	right = B if isinstance(B, ListType) else [B]
	left  = A if isinstance(A, ListType) else [A]
	return left + right


def _merge_lang(A, B) :
	""" Merge the B language structure into A """
	for key in B :
		A[key] = B[key] if key not in A else _merge_into_array(A[key], B[key])
	return A


def _merge_values(A, B, key, property_type, default_language) :
	"""Return the merge result of the values in A or B, depending on the property type"""

	if property_type == PropertyTypes.ARRAY :
		# "If the property is an array property, the way in which values are merged 
		# depends on the property; see the relevant property for this definition."
		# TBD
		if key == "columns" :
			# both A and B should be an array of objects. If, at any stage, there 
			# is an exception this means the assumption is wrong, and a fallback occurs
			for i in range(0,len(B)) :
				col_B = B[i]
				col_A = A[i]
				if col_A["name"] == col_B["name"] :
					_merge(col_A, col_B, default_language)
			return A
		else :
			# This is just a fall back position
			return A

	elif property_type == PropertyTypes.LINK_SINGLE :
		# the value in A wins
		return A

	elif property_type == PropertyTypes.LINK_ARRAY :
		# the result should be an array of links
		return _merge_into_array(A, B)

	elif property_type == PropertyTypes.URI_TEMPLATE :
		# the value in A wins
		return A

	elif property_type == PropertyTypes.COLUMN_REFERENCE :
		# the value in A wins
		return A

	elif property_type == PropertyTypes.OBJECT_SINGLE :
		if isinstance(A, basestring) or isinstance(B, basestring) :
			# the value in A wins
			return A
		else :
			return _merge(A, B, default_language=default_language)

	elif property_type == PropertyTypes.OBJECT_ARRAY :
		return _merge_into_array(A, B)

	elif property_type == PropertyTypes.NATURAL_LANGUAGE :
		if isinstance(A, basestring) :
			if isinstance(B, basestring) :
				return [A, B]
			elif type(B) is ListType :
				return [A] + B
			else :
				# B is a structured language object:
				a_lang = { default_language : A }
				return _merge_lang(a_lang, B)
		elif isinstance(A, ListType) :
			if isinstance(B, basestring) :
				return A + [B]
			elif isinstance(B[key], ListType) :
				return A + B
			else :
				# B is a structured language object:
				a_lang = { default_language : A }
				return _merge_lang(a_lang, B)
		else :
			if isinstance(B, basestring) :
				b_lang = { default_language : B }
				return _merge_lang(A, b_lang)
			elif isinstance(B, ListType) :
				b_lang = { default_language : B }
				return _merge_lang(A, b_lang)
			else :
				# B is a structured language object:
				return _merge_lang(A, B)

	elif property_type == PropertyTypes.ATOMIC_SINGLE :
		# the value in A wins
		return A

	elif property_type == PropertyTypes.ATOMIC_ARRAY :
		return _merge_into_array(A, B)

def _merge(A, B, default_language = "und") :
	"""
	Merge B into A
	"""
	# run through all the keys of B
	for key in B :
		if key not in A :
			# "If the property from B does not exist on A, it is simply added to A. "
			A[key] = B[key]

		elif key in PropertyTypes.properties.keys() :
			A[key] = _merge_values(A[key], B[key], key, PropertyTypes.properties[key], default_language)

		else :
			# The type of merge depends on the type of the value
			if isinstance(A[key], DictType) and isinstance(B[key], DictType) :
				return _merge_values(A[key], B[key], key, PropertyTypes.OBJECT_SINGLE, default_language)
			elif (isinstance(A[key], DictType) and isinstance(B[key], ListType)) or (isinstance(A[key], ListType) and isinstance(B[key], DictType)) :
				return _merge_values(A[key], B[key], key, PropertyTypes.OBJECT_ARRAY, default_language)
			elif isinstance(A[key], basestring) and isinstance(B[key], basestring) :
				return _merge_values(A[key], B[key], key, PropertyTypes.ATOMIC_SINGLE, default_language)
			elif (isinstance(A[key], basestring) and isinstance(B[key], ListType)) or (isinstance(A[key], ListType) and isinstance(B[key], basestring)) :
				return _merge_values(A[key], B[key], key, PropertyTypes.ATOMIC_ARRAY, default_language)

	# That is it!
	return A


##################################

import json

def test(metas) :
	"""metas is an array of string..."""
	retval = {}
	for mfile in metas :
		with open(mfile) as fp:
			meta = json.load(fp)
			_merge(retval,meta)
	return retval

