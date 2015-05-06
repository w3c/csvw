#! /usr/bin/env ruby
# Parse test manifest to create driver and area-specific test manifests

require 'getoptlong'
require 'csv'
require 'json'
require 'haml'
require 'fileutils'

class Manifest
  JSON_STATE = JSON::State.new(
    :indent       => "  ",
    :space        => " ",
    :space_before => "",
    :object_nl    => "\n",
    :array_nl     => "\n"
  )

  TITLE = {
    json: "CSVW JSON tests",
    rdf: "CSVW RDF Tests",
    validation: "CSVW Validation Tests"
  }
  DESCRIPTION = {
    json: "Tests transformation of CSV to JSON.",
    rdf: "Tests transformation of CSV to RDF.",
    validation: "Tests CSV validation using metadata."
  }
  EXTENTIONS = {
    json: 'json',
    rdf: 'ttl'
  }
  attr_accessor :prefixes, :terms, :properties, :classes, :instances, :datatypes

  Test = Struct.new(:id, :name, :comment, :approval, :option, :action, :result, :user_metadata, :link_metadata, :file_metadata, :directory_metadata)

  attr_accessor :tests

  def initialize
    csv = CSV.new(File.open(File.expand_path("../manifest.csv", __FILE__)))
    @prefixes, @terms, @properties, @classes, @datatypes, @instances = {}, {}, {}, {}, {}, {}

    columns = []
    csv.shift.each_with_index {|c, i| columns[i] = c.to_sym if c}

    @tests = csv.map do |line|
      entry = {}
      # Create entry as object indexed by symbolized column name
      line.each_with_index {|v, i| entry[columns[i]] = v ? v.gsub("\r", "\n").gsub("\\", "\\\\") : nil}

      extras = entry[:extra].to_s.split(/\s+/).inject({}) do |memo, e|
        k, v = e.split("=", 2)
        v = v[1..-2] if v =~ /^".*"$/
        memo[k.to_sym] = v.include?(',') ? v.split(',') : v
        memo
      end
      extras[:rdf] = entry[:rdf] == "TRUE"
      extras[:json] = entry[:json] == "TRUE"
      extras[:validation] = entry[:validate] == "TRUE"
      extras[:negative] = entry[:"test-type"] == "negative"
      extras[:warning] = entry[:"test-type"] == "warning"
      extras[:invalid] = entry[:"test-type"] == "invalid"
      test = Test.new(entry[:test], entry[:name], entry[:comment], entry[:approval], extras)

      if entry[:"directory-metadata"] == "TRUE" || test.option[:dir]
        test.action = extras.fetch(:action) do
          if entry[:"action-metadata"] == "TRUE"
            test.option[:implicit] ||= "#{test.id}/action.csv"
            "#{test.id}/metadata.json"
          else
            "#{test.id}/action.csv"
          end
        end
        
        test.result = extras.fetch(:result, "#{test.id}/result.") if extras[:rdf] || extras[:json]

        test.user_metadata = "#{test.id}/user-metadata.json" if entry[:"user-metadata"] == "TRUE"
        test.link_metadata = "#{test.id}/linked-metadata.json" if entry[:"link-metadata"] == "TRUE"
        test.file_metadata = "#{test.action}-metadata.json" if entry[:"file-metadata"] == "TRUE"
        test.directory_metadata = "#{test.id}/metadata.json" if entry[:"directory-metadata"] == "TRUE"
      else
        test.action = extras.fetch(:action) do
          entry[:"action-metadata"] == "TRUE" ? "#{test.id}-metadata.json" : "#{test.id}.csv"
          if entry[:"action-metadata"] == "TRUE"
            test.option[:implicit] ||= "#{test.id}.csv"
            "#{test.id}-metadata.json"
          else
            "#{test.id}.csv"
          end
        end
        test.result = extras.fetch(:result, "#{test.id}.") if extras[:rdf] || extras[:json]
        
        test.user_metadata = "#{test.id}-user-metadata.json" if entry[:"user-metadata"] == "TRUE"
        test.link_metadata = "#{test.id}-linked-metadata.json" if entry[:"link-metadata"] == "TRUE"
        test.file_metadata = "#{test.action}-metadata.json" if entry[:"file-metadata"] == "TRUE"
      end
      test.option[:implicit] = Array(test.option[:implicit])
      test.option[:implicit] += [test.user_metadata, test.link_metadata, test.file_metadata, test.directory_metadata].compact
      test
    end
  end

  # Create files referenced in the manifest
  def create_files
    tests.each do |test|
      FileUtils.mkdir(test.id.to_s) unless Dir.exist?(test.id.to_s) if test.directory_metadata || test.option[:dir]
      files = [test.action] + test.option[:implicit]
      files << "#{test.result}ttl"  if test.result && test.option[:rdf]
      files << "#{test.result}json" if test.result && test.option[:json]
      files.compact.select {|f| !File.exist?(f)}.each do |f|
        File.open(f, "w") {|io| io.puts( f.end_with?('.json') ? "{}" : "")}
      end
    end
  end

  def test_class(test, variant)
    case
    when test.option[:negative]
      case variant
      #when :rdf         then "csvt:ToRdfTest"
      #when :json        then "csvt:ToJsonTest"
      when :validation  then "csvt:NegativeValidationTest"
      end
    when test.option[:invalid]
      case variant
      when :rdf         then "csvt:ToRdfTest"
      when :json        then "csvt:ToJsonTest"
      when :validation  then "csvt:NegativeValidationTest"
      end
    when test.option[:warning]
      case variant
      when :rdf         then "csvt:ToRdfTest"
      when :json        then "csvt:ToJsonTest"
      when :validation  then "csvt:WarningValidationTest"
      end
    else
      case variant
      when :rdf         then "csvt:ToRdfTest"
      when :json        then "csvt:ToJsonTest"
      when :validation  then "csvt:PositiveValidationTest"
      end
    end
  end

  def to_jsonld(variant)
    context = ::JSON.parse %({
      "xsd": "http://www.w3.org/2001/XMLSchema#",
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      "mf": "http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#",
      "mq": "http://www.w3.org/2001/sw/DataAccess/tests/test-query#",
      "csvt": "http://w3c.github.io/csvw/test-vocab#",
      "id": "@id",
      "type": "@type",
      "action": {"@id": "mf:action",  "@type": "@id"},
      "approval": {"@id": "csvt:approval", "@type": "@id"},
      "comment": "rdfs:comment",
      "contentType": "csvt:contentType",
      "entries": {"@id": "mf:entries", "@type": "@id", "@container": "@list"},
      "httpLink": "csvt:httpLink",
      "implicit": {"@id": "mf:implicit", "@type": "@id", "@container": "@set"},
      "label": "rdfs:label",
      "metadata": {"@id": "csvt:metadata", "@type": "@id"},
      "minimal": "csvt:minimal",
      "name": "mf:name",
      "noProv": "csvt:noProv",
      "option": "csvt:option",
      "result": {"@id": "mf:result", "@type": "@id"}
    })

    manifest = {
      "@context" => context,
      "id" => "manifest-#{variant}",
      "type" => "mf:Manifest",
      "label" => TITLE[variant],
      "comment" => DESCRIPTION[variant],
      "entries" => []
    }

    tests.each do |test|
      next unless test.option[variant]

      entry = {
        "id" => "manifest-#{variant}##{test.id}",
        "type" => test_class(test, variant),
        "name" => test.name,
        "comment" => test.comment,
        "approval" => (test.approval ? "csvt:#{test.approval}" : "csvt:Proposed"),
        "option" => {"noProv" => true},
        "action" => test.action,
      }

      entry["result"] = "#{test.result}#{EXTENTIONS[variant]}" if [:rdf, :json].include?(variant)
      entry["implicit"] = test.option[:implicit] unless test.option[:implicit].empty?
      entry["httpLink"] = %(<#{test.link_metadata.split('/').last}>; rel="describedby") if test.link_metadata

      entry["option"]["metadata"] = test.user_metadata if test.user_metadata
      entry["option"]["minimal"] = true if test.option[:minimal]
      entry["contentType"] = test.option[:contentType] if test.option[:contentType]
      manifest["entries"] << entry
    end

    manifest.to_json(JSON_STATE)
  end

  def to_html
    # Create vocab.html using vocab_template.haml and compacted vocabulary
    template = File.read("template.haml")
    manifests = %w(json rdf validation).inject({}) do |memo, v|
      memo["manifest-#{v}"] = ::JSON.load(File.read("manifest-#{v}.jsonld"))
      memo
    end

    Haml::Engine.new(template, :format => :html5).render(self,
      man: ::JSON.load(File.read("manifest.jsonld")),
      manifests: manifests
    )
  end

  def to_ttl(variant)
    output = []
    output << %(# CSV+ tests
## Distributed under both the W3C Test Suite License[1] and the W3C 3-
## clause BSD License[2]. To contribute to a W3C Test Suite, see the
## policies and contribution forms [3]
##
## 1. http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
## 2. http://www.w3.org/Consortium/Legal/2008/03-bsd-license
## 3. http://www.w3.org/2004/10/27-testcases
##
## Test types (for now)
## * CsvToJsonTest  - tests CSV evaluation to JSON
## * CsvToRdfTest   - tests CSV evaluation to RDF using graph isomorphism
## * CsvSparqlTest - tests CSV evaulation to RDF using SPARQL ASK query

@prefix : <manifest-#{variant}#> .
@prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix mf:   <http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#> .
@prefix csvt: <http://w3c.github.io/csvw/tests/vocab#> .

<manifest-#{variant}>  a mf:Manifest ;
)
    output << %(  rdfs:label "#{TITLE[variant]}";)
    output << %(  rdfs:comment "#{DESCRIPTION[variant]}";)
    output << %(  mf:entries \()

    tests.select {|t| t.option[variant]}.map {|t| ":#{t.id}"}.each_slice(10) do |entries|
      output << %(    #{entries.join(' ')})
    end
    output << %(  \) .)

    tests.select {|t| t.option[variant]}.each do |test|
      output << "" # separator
      output << ":#{test.id} a #{test_class(test, variant)};"
      output << %(  mf:name "#{test.name}";)
      output << %(  rdfs:comment "#{test.comment}";)
      output << %(  csvt:approval #{(test.approval ? "csvt:#{test.approval}" : "csvt:Proposed")};)
      output << %(  csvt:option [\n    csvt:noProv true;)
      output << %(    csvt:metadata <#{test.user_metadata}>;) if test.user_metadata
      output << %(    csvt:minimal true;) if test.option[:minimal]
      output << %(  ];)
      output << %(  csvt:httpLink "<#{test.link_metadata.split('/').last}>; rel=\\"describedby\\"";) if test.link_metadata
      output << %(  mf:action <#{test.action}>;)
      output << %(  mf:result <#{test.result}#{EXTENTIONS[variant]}>;) if [:rdf, :json].include?(variant)
      output << %(  csvt:contentType "#{test.option[:contentType]}";) if test.option[:contentType]

      implicit = test.option[:implicit].map {|f| "<#{f}>"}.join(",\n    ")
      output << %(  csvt:implicit #{implicit};) unless implicit.empty?
      output << %(  .)
    end
    output.join("\n")
  end
end

options = {
  output: $stdout
}

OPT_ARGS = [
  ["--format", "-f",  GetoptLong::REQUIRED_ARGUMENT,"Output format, default #{options[:format].inspect}"],
  ["--output", "-o",  GetoptLong::REQUIRED_ARGUMENT,"Output to the specified file path"],
  ["--quiet",         GetoptLong::NO_ARGUMENT,      "Supress most output other than progress indicators"],
  ["--touch",         GetoptLong::NO_ARGUMENT,      "Create referenced files and directories if missing"],
  ["--variant",       GetoptLong::REQUIRED_ARGUMENT,"Test variant, 'rdf' or 'json'"],
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
  when '--touch'        then options[:touch] = true
  when '--variant'      then options[:variant] = arg.to_sym
  when '--help'         then usage
  end
end

vocab = Manifest.new
vocab.create_files if options[:touch]
if options[:format] || options[:variant]
  case options[:format]
  when :jsonld  then options[:output].puts(vocab.to_jsonld(options[:variant]))
  when :ttl     then options[:output].puts(vocab.to_ttl(options[:variant]))
  when :html    then options[:output].puts(vocab.to_html)
  else  STDERR.puts "Unknown format #{options[:format].inspect}"
  end
else
  %w(json rdf validation).each do |variant|
    %w(jsonld ttl).each do |format|
      File.open("manifest-#{variant}.#{format}", "w") do |output|
        output.puts(vocab.send("to_#{format}".to_sym, variant.to_sym))
      end
    end
  end
  File.open("index.html", "w") do |output|
    output.puts(vocab.to_html)
  end
end
