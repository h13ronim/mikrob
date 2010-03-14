namespace :assets do
  def haml_parse(file)
    `haml #{file} > #{file.sub("haml","html")}`
  end
  def sass_parse(file)
    `sass #{file} > #{file.sub("sass","css")}`
  end


  desc "generate html and css from haml and sass files"
  task :generate do
    # TODO add automatic file discovery, k?
    Dir["Resources/"].each do |file|
      case file
      when /haml$/ then haml_parse file
      when /sass$/ then sass_parse file
      end
    end
  end

end
namespace :source do
  desc "Check the JavaScript source with JSLint - exit with status 1 if any of the files fail."
  task :jslint do
    jsl_path = "jsl" # get jsl bin from http://javascriptlint.com
    failed_files = []

    Dir['Resources/class/**/*.js'].reject{|path| path =~ /javascripts.js/ }.each do |fname|
      cmd = "#{jsl_path} -nologo -nocontext -nofilelisting -process #{fname} | grep err"
      results = %x{#{cmd}}
      puts "#{fname} | " << results
      results.gsub("(s)","").split(",").each do |result|
        result = result.split(" ")

        if result[0].to_i > 0 and result[1] =~ /error/
          failed_files << fname
        end
      end
    end
    puts "="*80
    if failed_files.size > 0
      failed_files.each { |file| puts "[ERROR] " << file }
      exit 1
    else
      puts "No problems"
    end
  end
end
namespace :application do
  SDK_VERSION = "1.0.0"
  def build_command_linux
    `python ~/.titanium/sdk/linux/#{SDK_VERSION}/tibuild.py -r -a ~/.titanium/sdk/linux/#{SDK_VERSION} .`
  end
  def deploy_linux(destination)
    `python ~/.titanium/sdk/linux/#{SDK_VERSION}/tibuild.py -d #{destination} -a ~/.titanium/sdk/linux/#{SDK_VERSION} .`
  end

  def build_command_osx
    `python "/Library/Application\ Support/Titanium/sdk/osx/#{SDK_VERSION}/tibuild.py" -r -a "/Library/Application\ Support/Titanium/sdk/osx/#{SDK_VERSION}" .`
  end
  def deploy_osx(destination)
    `python "/Library/Application\ Support/Titanium/sdk/osx/#{SDK_VERSION}/tibuild.py" -d #{destination} -a "/Library/Application\ Support/Titanium/sdk/osx/#{SDK_VERSION}" .`
  end

  def sorry
    puts "Sorry - Windows sucks"
    exit
  end

  def before_filter # :-)
    Rake::Task['source:jslint'].invoke
    Rake::Task['assets:generate'].invoke
  end

  desc "build application"
  task :build do
    before_filter
    case RUBY_PLATFORM
    when /darwin/ then build_command_osx
    when /linux/ then build_command_linux
    else sorry
    end
  end

  desc "deploy application"
  task :deploy do
    before_filter
    target = "~/Desktop/" # TODO change this into a param or sth
    case RUBY_PLATFORM
    when /darwin/ then deploy_osx target
    when /linux/ then deploy_linux target
    else sorry
    end
  end

end

desc "Run in dev mode"
task :run do
  Rake::Task["application:build"].invoke
end

task :default => [:run]
