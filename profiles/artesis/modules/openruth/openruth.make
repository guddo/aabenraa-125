api = 2
core = 7.x

projects[date][subdir] = contrib
projects[date][version] = 2.0-rc1

projects[features][subdir] = contrib
projects[features][version] = 1.0-beta4

projects[profile2][version] = 1.2
projects[profile2][subdir] = contrib

; Ding! modules

projects[ding_provider][type] = "module"
projects[ding_provider][download][type] = "git"
projects[ding_provider][download][url] = "git@github.com:ding2/ding_provider.git"
projects[ding_provider][download][tag] = "7.x-0.13"
