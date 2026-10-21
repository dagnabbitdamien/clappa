#pragma once
#include <QString>
#include <memory>
class NativeService {
public:
    explicit NativeService(const QString &root,bool reset=false);
    ~NativeService();
    void tick();
    void setAddress(const QString &address);
    QString status() const;
    QString publicIdentity() const;
    bool paired() const;
    bool notifyChatRequest();
private:
    struct Impl;
    std::unique_ptr<Impl> p;
};
