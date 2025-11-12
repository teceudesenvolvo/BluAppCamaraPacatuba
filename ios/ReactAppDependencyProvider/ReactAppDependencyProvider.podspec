Pod::Spec.new do |s|
  s.name         = 'ReactAppDependencyProvider'
  s.version      = '0.0.0'
  s.summary      = 'Local generated pod for ReactAppDependencyProvider'
  s.homepage     = 'https://facebook.com/'
  s.license      = { :type => 'Unlicense' }
  s.author       = { 'Local' => 'local@example.com' }
  s.platform     = :ios, '15.1'
  s.source       = { :path => '../build/generated/ios' }
  s.source_files = '../build/generated/ios/**/*.{h,m,mm,swift,c,cpp}'
  s.pod_target_xcconfig = { 'HEADER_SEARCH_PATHS' => '$(PODS_ROOT)/Headers/Private/React-Core' }
  s.requires_arc = true
end
