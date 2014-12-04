#! /usr/bin/env ruby
# Parse vocabulary definition in CSV to generate Context+Vocabulary in JSON-LD or Turtle

require 'getoptlong'
require 'csv'
require 'json'

class Vocab
  JSON_STATE = JSON::State.new(
    :indent       => "  ",
    :space        => " ",
    :space_before => "",
    :object_nl    => "\n",
    :array_nl     => "\n"
  )
  attr_accessor :prefixes, :terms, :properties, :classes, :instances, :datatypes

  def initialize(file)
    csv = CSV.new(File.open(file))
    @prefixes, @terms, @properties, @classes, @datatypes, @instances = {}, {}, {}, {}, {}, {}

    columns = []
    csv.shift.each_with_index {|c, i| columns[i] = c.to_sym if c}

    csv.each do |line|
      entry = {}
      # Create entry as object indexed by symbolized column name
      line.each_with_index {|v, i| entry[columns[i]] = v ? v.gsub("\r", "\n").gsub("\\", "\\\\") : nil}

      case entry[:type]
      when 'prefix'         then @prefixes[entry[:id]] = entry
      when 'term'           then @terms[entry[:id]] = entry
      when 'rdf:Property'   then @properties[entry[:id]] = entry
      when 'rdfs:Class'     then @classes[entry[:id]] = entry
      when 'rdfs:Datatype'  then @datatypes[entry[:id]] = entry
      else                       @instances[entry[:id]] = entry
      end
    end
  end

  def to_jsonld
    rdfs_context = ::JSON.parse %({
      "rdfs:domain": {"@type": "@id"},
      "rdfs:range": {"@type": "@id"},
      "rdfs:subClassOf": {"@type": "@id"},
      "rdfs:subPropertyOf": {"@type": "@id"},
      "owl:equivalentClass": {"@type": "@vocab"},
      "owl:equivalentProperty": {"@type": "@vocab"},
      "owl:oneOf": {"@container": "@list", "@type": "@vocab"},
      "owl:imports": {"@type": "@id"},
      "owl:versionInfo": {"@type": "xsd:string", "@language": null},
      "owl:inverseOf": {"@type": "@vocab"},
      "owl:unionOf": {"@type": "@vocab", "@container": "@list"}
    })
    context = {'id' => '@id', 'type' => '@type'}
    nodes = []

    nodes << {
      "@id" => prefixes["csvm"][:subClassOf],
      "dc:title" => "Metadata Vocabulary for Tabular Data",
      "dc:description" => %(Validation, conversion, display and search of tabular data on the web
    requires additional metadata that describes how the data should be
    interpreted. This document defines a vocabulary for metadata that
    annotates tabular data. This can be used to provide metadata at various
    levels, from collections of data from CSV documents and how they relate
    to each other down to individual cells within a table.)
    }
    prefixes.each do |id, entry|
      context[id] = entry[:subClassOf]
    end

    terms.each do |id, entry|
      context[id] = entry[:subClassOf]
    end

    classes.each  do |id, entry|
      context[id] = "csvm:#{id}"

      # Class definition
      node = {
        '@id' => "csvm:#{id}",
        '@type' => 'rdfs:Class',
        'rdfs:label' => entry[:label],
        'rdfs:comment' => entry[:comment],
      }
      node['rdfs:subClassOf'] = entry[:subClassOf] if entry[:subClassOf]
      nodes << node
    end

    properties.each do |id, entry|
      defn = {"@id" => "csvm:#{id}"}
      case entry[:range]
      when /xsd:/                 then defn['@type'] = entry[:range]
      when 'Dialect', 'Direction' then defn['@type'] = '@vocab'
      when nil                    then ;
      else                             defn['@type'] = '@id'
      end

      defn['@container'] = entry[:container] if entry[:container]
      context[id] = defn

      # Property definition
      node = {
        '@id' => "csvm:#{id}",
        '@type' => 'rdf:Property',
        'rdfs:label' => entry[:label],
        'rdfs:comment' => entry[:comment],
      }
      node['rdfs:subPropertyOf'] = entry[:subClassOf] if entry[:subClassOf]

      domains = entry[:domain].to_s.split(',')
      case domains.length
      when 0  then ;
      when 1  then node['rdfs:domain'] = domains.first
      else         node['rdfs:domain'] = {'owl:unionOf' => domains}
      end

      ranges = entry[:range].to_s.split(',')
      case ranges.length
      when 0  then ;
      when 1  then node['rdfs:range'] = ranges.first
      else         node['rdfs:range'] = {'owl:unionOf' => ranges}
      end

      nodes << node
    end

    datatypes.each  do |id, entry|
      context[id] = "csvm:#{id}"

      # Datatype definition
      node = {
        '@id' => "csvm:#{id}",
        '@type' => 'rdfs:Datatype',
        'rdfs:label' => entry[:label],
        'rdfs:comment' => entry[:comment],
      }
      node['rdfs:subClassOf'] = entry[:subClassOf] if entry[:subClassOf]
      nodes << node
    end

    instances.each do |id, entry|
      # Instance definition
      nodes << {
        '@id' => "csvm:#{id}",
        '@type' => entry[:type],
        'rdfs:label' => entry[:label],
        'rdfs:comment' => entry[:comment],
      }
    end

    # Add on stuff useful for serializing the vocabulary
    context.merge!(rdfs_context)

    return {'@context' => context, '@graph' => nodes}.to_json(JSON_STATE)
  end

  def to_ttl
    output = []

    @prefixes.each {|id, entry| output << "@prefix #{id}: <#{entry[:subClassOf]}> ."}

    output << "\n# CSVM Ontology definition"
    output << "csvm: a owl:Ontology;"
    output << %(  dc:title "Metadata Vocabulary for Tabular Data";)
    output << %(  dc:description """Validation, conversion, display and search of tabular data on the web
    requires additional metadata that describes how the data should be
    interpreted. This document defines a vocabulary for metadata that
    annotates tabular data. This can be used to provide metadata at various
    levels, from collections of data from CSV documents and how they relate
    to each other down to individual cells within a table.""";)
    output << "  .\n"

    output << "\n# Class definitions"
    @classes.each do |id, entry|
      output << "csvm:#{id} a rdfs:Class;"
      output << %(  rdfs:label "#{entry[:label]}";)
      output << %(  rdfs:comment """#{entry[:comment]}""";)
      output << %(  rdfs:subClassOf #{entry[:subClassOf].include?(':') ? entry[:subClassOf] : "csvm:" + entry[:subClassOf]};) if entry[:subClassOf]
      output << "  .\n"
    end

    output << "\n# Property definitions"
    @properties.each do |id, entry|
      output << "csvm:#{id} a rdf:Property;"
      output << %(  rdfs:label "#{entry[:label]}";)
      output << %(  rdfs:comment """#{entry[:comment]}""";)
      output << %(  rdfs:subPropertyOf #{entry[:subClassOf].include?(':') ? entry[:subClassOf] : "csvm:" + entry[:subClassOf]};) if entry[:subClassOf]
      domains = entry[:domain].to_s.split(',')
      case domains.length
      when 0  then ;
      when 1  then output << %(  rdfs:domain #{entry[:domain].include?(':') ? entry[:domain] : "csvm:" + entry[:domain]};)
      else
        output << %(  rdfs:domain [ owl:unionOf (#{domains.map {|d| d.include?(':') ? d : 'csvm:' + d}.join(' ')})];)
      end

      ranges = entry[:range].to_s.split(',')
      case ranges.length
      when 0  then ;
      when 1  then output << %(  rdfs:range #{entry[:range].include?(':') ? entry[:range] : "csvm:" + entry[:range]};)
      else
        output << %(  rdfs:range [ owl:unionOf (#{ranges.map {|d| d.include?(':') ? d : 'csvm:' + d}.join(' ')})];)
      end
      output << "  .\n"
    end

    output << "\n# Datatype definitions"
    @datatypes.each do |id, entry|
      output << "csvm:#{id} a rdfs:Datatype;"
      output << %(  rdfs:label "#{entry[:label]}";)
      output << %(  rdfs:comment """#{entry[:comment]}""";)
      output << %(  rdfs:subClassOf #{entry[:subClassOf].include?(':') ? entry[:subClassOf] : "csvm:" + entry[:subClassOf]};) if entry[:subClassOf]
      output << "  .\n"
    end

    output << "\n# Instance definitions"
    @instances.each do |id, entry|
      output << "csvm:#{id} a #{entry[:type].include?(':') ? entry[:type] : "csvm:" + entry[:type]};"
      output << %(  rdfs:label "#{entry[:label]}";)
      output << %(  rdfs:comment """#{entry[:comment]}""";)
      output << "  .\n"
    end

    output.join("\n")
  end

end

options = {
  format: :jsonld,
  output: $stdout
}

OPT_ARGS = [
  ["--format", "-f",  GetoptLong::REQUIRED_ARGUMENT,"Output format, default #{options[:format].inspect}"],
  ["--output", "-o",  GetoptLong::REQUIRED_ARGUMENT,"Output to the specified file path"],
  ["--quiet",         GetoptLong::NO_ARGUMENT,      "Supress most output other than progress indicators"],
  ["--help", "-?",    GetoptLong::NO_ARGUMENT,      "This message"]
]
def usage
  STDERR.puts %{Usage: #{$0} [options] URL ...}
  width = OPT_ARGS.map do |o|
    l = o.first.length
    l += o[1].length + 2 if o[1].is_a?(String)
    l
  end.max
  OPT_ARGS.each do |o|
    s = "  %-*s  " % [width, (o[1].is_a?(String) ? "#{o[0,2].join(', ')}" : o[0])]
    s += o.last
    STDERR.puts s
  end
  exit(1)
end

opts = GetoptLong.new(*OPT_ARGS.map {|o| o[0..-2]})

opts.each do |opt, arg|
  case opt
  when '--format'       then options[:format] = arg.to_sym
  when '--output'       then options[:output] = File.open(arg, "w")
  when '--quiet'        then options[:quiet] = true
  when '--help'         then usage
  end
end

vocab = Vocab.new(ARGV[0])
case options[:format]
when :jsonld  then options[:output].puts(vocab.to_jsonld)
when :ttl     then options[:output].puts(vocab.to_ttl)
else  STDERR.puts "Unknown format #{options[:format].inspect}"
end
