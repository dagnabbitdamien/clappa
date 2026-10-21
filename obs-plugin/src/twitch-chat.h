#pragma once
#include <QWidget>
#include <functional>

// Owned by the dock. Destruction closes the TLS listener and forgets credentials.
QWidget *makeTwitchChatPanel(QWidget *parent,std::function<bool()> request);
